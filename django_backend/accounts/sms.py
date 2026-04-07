import logging
import os
import ssl
from base64 import b64encode
from urllib import parse
from urllib import error, request

from django.conf import settings

logger = logging.getLogger(__name__)


class SmsDeliveryError(Exception):
    """Ошибка доставки SMS кода."""


def _is_placeholder(value: str) -> bool:
    v = (value or "").strip()
    return not v or "..." in v or v.lower() in {"your_sms_to_api_key", "changeme"}


def _get_ssl_context():
    verify = (
        getattr(settings, "SMS_SSL_VERIFY", None)
        if hasattr(settings, "SMS_SSL_VERIFY")
        else None
    )
    if verify is None:
        verify = os.environ.get("SMS_SSL_VERIFY", "1")
    verify_enabled = str(verify).strip().lower() not in {"0", "false", "no"}
    if not verify_enabled:
        logger.warning("SMS SSL verification is disabled (SMS_SSL_VERIFY=0)")
        return ssl._create_unverified_context()  # nosec B323 - explicit dev override
    return ssl.create_default_context()


def _use_system_proxy() -> bool:
    use_proxy = (
        getattr(settings, "SMS_USE_SYSTEM_PROXY", None)
        if hasattr(settings, "SMS_USE_SYSTEM_PROXY")
        else None
    )
    if use_proxy is None:
        use_proxy = os.environ.get("SMS_USE_SYSTEM_PROXY", "0")
    return str(use_proxy).strip().lower() in {"1", "true", "yes"}


def _open_url(req: request.Request, timeout: int = 15):
    """
    Для SMS запросов по умолчанию обходим системные proxy,
    т.к. они часто режут HTTPS туннель до провайдера SMS.
    """
    ctx = _get_ssl_context()
    if _use_system_proxy():
        return request.urlopen(req, timeout=timeout, context=ctx)
    opener = request.build_opener(
        request.ProxyHandler({}),
        request.HTTPSHandler(context=ctx),
    )
    return opener.open(req, timeout=timeout)


def _get_smsto_api_key() -> str:
    """
    Возвращает API ключ SMS.to из окружения/настроек.
    Поддерживаем оба имени переменной: SMSTO_API_KEY и SMSTO_API_TOKEN.
    """
    api_key = (
        getattr(settings, "SMSTO_API_KEY", "")
        or getattr(settings, "SMSTO_API_TOKEN", "")
        or os.environ.get("SMSTO_API_KEY", "")
        or os.environ.get("SMSTO_API_TOKEN", "")
    ).strip()
    # Часто ключ сохраняют как "Bearer xxx" — для header нужен только токен.
    if api_key.lower().startswith("bearer "):
        api_key = api_key[7:].strip()
    return api_key


def _send_smsto_sms(phone_e164: str, text: str) -> None:
    api_key = _get_smsto_api_key()
    sender_id = getattr(settings, "SMSTO_SENDER_ID", "") or os.environ.get(
        "SMSTO_SENDER_ID", "SMSto"
    )
    base_url = getattr(settings, "SMSTO_BASE_URL", "") or os.environ.get(
        "SMSTO_BASE_URL", "https://api.sms.to"
    )

    if _is_placeholder(api_key):
        raise SmsDeliveryError(
            "SMS.to не настроен: укажите SMSTO_API_KEY (или SMSTO_API_TOKEN)."
        )

    try:
        import json

        payload_obj = {
            "message": text,
            "to": phone_e164,
            "sender_id": sender_id,
            # Для OTP предотвращает отказ отправки на opt-out номерах.
            "bypass_optout": True,
        }
        payload = json.dumps(payload_obj).encode("utf-8")
        req = request.Request(
            url=f"{base_url.rstrip('/')}/sms/send",
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        with _open_url(req, timeout=15) as resp:
            body = resp.read().decode("utf-8") if resp else ""
            if resp.status >= 300:
                raise SmsDeliveryError(
                    f"SMS.to ошибка: HTTP {resp.status} {body[:180]}"
                )
        logger.info("SMS.to: код отправлен на %s", phone_e164)
    except error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = ""
        logger.exception("SMS.to HTTP error")
        if e.code == 401:
            raise SmsDeliveryError(
                "SMS.to вернул 401 (invalid API key/token или блокировка token/IP). Проверьте ключ, баланс и whitelist IP в кабинете SMS.to."
            ) from e
        if e.code == 402:
            raise SmsDeliveryError(
                "SMS.to: недостаточно баланса для отправки. Пополните баланс в кабинете SMS.to."
            ) from e
        raise SmsDeliveryError(f"SMS.to ошибка: HTTP {e.code} {body[:180]}".strip()) from e
    except error.URLError as e:
        logger.exception("SMS.to URL error")
        raise SmsDeliveryError(f"SMS.to сеть недоступна: {e.reason}") from e


def _send_twilio_sms(phone_e164: str, text: str) -> None:
    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or os.environ.get(
        "TWILIO_ACCOUNT_SID", ""
    )
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or os.environ.get(
        "TWILIO_AUTH_TOKEN", ""
    )
    from_number = getattr(settings, "TWILIO_FROM_NUMBER", "") or os.environ.get(
        "TWILIO_FROM_NUMBER", ""
    )
    if (
        _is_placeholder(account_sid)
        or _is_placeholder(auth_token)
        or _is_placeholder(from_number)
    ):
        raise SmsDeliveryError(
            "Twilio не настроен: нужны TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN и TWILIO_FROM_NUMBER."
        )

    try:
        form_data = parse.urlencode(
            {
                "To": phone_e164,
                "From": from_number,
                "Body": text,
            }
        ).encode("utf-8")
        creds_raw = f"{account_sid}:{auth_token}".encode("utf-8")
        creds = b64encode(creds_raw).decode("ascii")
        req = request.Request(
            url=f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
            data=form_data,
            method="POST",
            headers={
                "Authorization": f"Basic {creds}",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
        )
        with _open_url(req, timeout=15) as resp:
            body = resp.read().decode("utf-8") if resp else ""
            if resp.status >= 300:
                raise SmsDeliveryError(
                    f"Twilio ошибка: HTTP {resp.status} {body[:180]}"
                )
        logger.info("Twilio: код отправлен на %s", phone_e164)
    except error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = ""
        logger.exception("Twilio HTTP error")
        raise SmsDeliveryError(f"Twilio ошибка: HTTP {e.code} {body[:180]}".strip()) from e
    except error.URLError as e:
        logger.exception("Twilio URL error")
        raise SmsDeliveryError(f"Twilio сеть недоступна: {e.reason}") from e


def send_login_code_sms(phone_e164: str, code: str) -> None:
    """
    Отправляет 4-значный код по SMS.
    SMS_PROVIDER: auto | sms_to | twilio | mock
    """
    text = f"Coffich: ваш код входа: {code}"
    provider = (
        getattr(settings, "SMS_PROVIDER", "")
        or os.environ.get("SMS_PROVIDER", "auto")
    ).strip().lower()

    if provider == "mock":
        logger.info("MOCK SMS to %s: code=%s", phone_e164, code)
        return

    smsto_configured = not _is_placeholder(_get_smsto_api_key())
    twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or os.environ.get(
        "TWILIO_ACCOUNT_SID", ""
    )
    twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or os.environ.get(
        "TWILIO_AUTH_TOKEN", ""
    )
    twilio_from = getattr(settings, "TWILIO_FROM_NUMBER", "") or os.environ.get(
        "TWILIO_FROM_NUMBER", ""
    )
    twilio_configured = bool(
        not _is_placeholder(twilio_sid)
        and not _is_placeholder(twilio_token)
        and not _is_placeholder(twilio_from)
    )

    if provider == "sms_to":
        _send_smsto_sms(phone_e164, text)
        return
    if provider == "twilio":
        _send_twilio_sms(phone_e164, text)
        return

    if smsto_configured:
        try:
            _send_smsto_sms(phone_e164, text)
            return
        except SmsDeliveryError as smsto_error:
            if twilio_configured:
                logger.warning("SMS.to failed in auto mode, trying Twilio fallback")
                _send_twilio_sms(phone_e164, text)
                return
            raise smsto_error

    if twilio_configured:
        _send_twilio_sms(phone_e164, text)
        return

    raise SmsDeliveryError(
        "SMS не настроен: задайте SMS_PROVIDER=sms_to|twilio|auto и заполните соответствующие ключи."
    )
