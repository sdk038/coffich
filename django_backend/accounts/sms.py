import logging
import os
from urllib import error, request

from django.conf import settings

logger = logging.getLogger(__name__)


class SmsDeliveryError(Exception):
    """Ошибка доставки SMS кода."""


def send_login_code_sms(phone_e164: str, code: str) -> None:
    """Отправляет 4-значный код по SMS через SMS.to."""
    text = f"Coffich: ваш код входа: {code}"

    api_key = getattr(settings, "SMSTO_API_KEY", "") or os.environ.get(
        "SMSTO_API_KEY", ""
    )
    sender_id = getattr(settings, "SMSTO_SENDER_ID", "") or os.environ.get(
        "SMSTO_SENDER_ID", "SMSto"
    )
    base_url = getattr(settings, "SMSTO_BASE_URL", "") or os.environ.get(
        "SMSTO_BASE_URL", "https://api.sms.to"
    )

    if not api_key:
        raise SmsDeliveryError(
            "SMS не настроен: укажите SMSTO_API_KEY в окружении backend."
        )

    try:
        import json

        payload = json.dumps(
            {
                "message": text,
                "to": phone_e164,
                "sender_id": sender_id,
            }
        ).encode("utf-8")
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
        with request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8") if resp else ""
            if resp.status >= 300:
                raise SmsDeliveryError(
                    f"SMS.to ошибка: HTTP {resp.status} {body[:180]}"
                )
        logger.info("SMS-код отправлен на %s", phone_e164)
    except error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = ""
        logger.exception("SMS.to HTTP error")
        raise SmsDeliveryError(
            f"SMS.to ошибка: HTTP {e.code} {body[:180]}".strip()
        ) from e
    except error.URLError as e:
        logger.exception("SMS.to URL error")
        raise SmsDeliveryError(f"SMS.to сеть недоступна: {e.reason}") from e
    except Exception as e:
        logger.exception("SMS.to unknown error")
        raise SmsDeliveryError("Не удалось отправить SMS код") from e
