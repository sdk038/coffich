import logging
import os

from django.conf import settings

logger = logging.getLogger(__name__)


class SmsDeliveryError(Exception):
    """Ошибка доставки SMS кода."""


def send_login_code_sms(phone_e164: str, code: str) -> None:
    """Отправляет 4-значный код по SMS через Twilio."""
    text = f"Coffich: ваш код входа: {code}"

    sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or os.environ.get(
        "TWILIO_ACCOUNT_SID", ""
    )
    token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or os.environ.get(
        "TWILIO_AUTH_TOKEN", ""
    )
    from_num = getattr(settings, "TWILIO_FROM_NUMBER", "") or os.environ.get(
        "TWILIO_FROM_NUMBER", ""
    )

    if not sid or not token or not from_num:
        raise SmsDeliveryError(
            "SMS не настроен: укажите TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN и TWILIO_FROM_NUMBER в окружении backend."
        )

    try:
        from twilio.base.exceptions import TwilioRestException
        from twilio.rest import Client

        client = Client(sid, token)
        client.messages.create(body=text, from_=from_num, to=phone_e164)
        logger.info("SMS-код отправлен на %s", phone_e164)
    except TwilioRestException as e:
        logger.exception("Twilio API error")
        raise SmsDeliveryError(
            f"Twilio ошибка: {e.msg or 'не удалось отправить SMS'}"
        ) from e
    except Exception as e:
        logger.exception("Twilio unknown error")
        raise SmsDeliveryError("Не удалось отправить SMS код") from e
