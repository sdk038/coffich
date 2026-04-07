import json
import logging
import os
import ssl
from urllib import error, request

from django.conf import settings

logger = logging.getLogger(__name__)


class TelegramDeliveryError(Exception):
    """Ошибка отправки заказа в Telegram."""


def _value(name: str, default: str = "") -> str:
    return str(getattr(settings, name, "") or os.environ.get(name, default)).strip()


def _telegram_ssl_context():
    verify = _value("TELEGRAM_SSL_VERIFY", _value("SMS_SSL_VERIFY", "1"))
    verify_enabled = verify.lower() not in {"0", "false", "no"}
    if not verify_enabled:
        return ssl._create_unverified_context()  # nosec B323 - explicit local override
    return ssl.create_default_context()


def _open_url(req: request.Request, timeout: int = 15):
    use_proxy = _value("TELEGRAM_USE_SYSTEM_PROXY", "0").lower() in {"1", "true", "yes"}
    ctx = _telegram_ssl_context()
    if use_proxy:
        return request.urlopen(req, timeout=timeout, context=ctx)
    opener = request.build_opener(
        request.ProxyHandler({}),
        request.HTTPSHandler(context=ctx),
    )
    return opener.open(req, timeout=timeout)


def is_telegram_configured() -> bool:
    return bool(_value("TELEGRAM_BOT_TOKEN") and _value("TELEGRAM_CHAT_ID"))


def _build_order_message(*, customer_name: str, phone: str, items: list[dict], total_sum: int, note: str = "") -> str:
    lines = [
        "Новый заказ с сайта Coffich",
        "",
        f"Клиент: {customer_name}",
        f"Телефон: {phone}",
        "",
        "Позиции:",
    ]
    for idx, item in enumerate(items, start=1):
        title = item["title"]
        qty = item["quantity"]
        price = item["price"]
        line_sum = price * qty
        lines.append(f"{idx}. {title} x{qty} — {line_sum:,} сум".replace(",", " "))

    lines.extend(
        [
            "",
            f"Итого: {total_sum:,} сум".replace(",", " "),
        ]
    )

    if note:
        lines.extend(["", f"Комментарий: {note}"])
    return "\n".join(lines)


def send_order_to_telegram(*, customer_name: str, phone: str, items: list[dict], total_sum: int, note: str = "") -> None:
    token = _value("TELEGRAM_BOT_TOKEN")
    chat_id = _value("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        raise TelegramDeliveryError(
            "Telegram не настроен: укажите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env backend."
        )

    payload = json.dumps(
        {
            "chat_id": chat_id,
            "text": _build_order_message(
                customer_name=customer_name,
                phone=phone,
                items=items,
                total_sum=total_sum,
                note=note,
            ),
        }
    ).encode("utf-8")
    req = request.Request(
        url=f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with _open_url(req, timeout=15) as resp:
            body = resp.read().decode("utf-8") if resp else ""
            if resp.status >= 300:
                raise TelegramDeliveryError(
                    f"Telegram ошибка: HTTP {resp.status} {body[:180]}"
                )
        logger.info("Order sent to Telegram chat %s", chat_id)
    except error.HTTPError as exc:
        body = ""
        try:
            body = exc.read().decode("utf-8")
        except Exception:
            body = ""
        logger.exception("Telegram HTTP error")
        raise TelegramDeliveryError(
            f"Telegram ошибка: HTTP {exc.code} {body[:180]}".strip()
        ) from exc
    except error.URLError as exc:
        logger.exception("Telegram URL error")
        raise TelegramDeliveryError(f"Telegram сеть недоступна: {exc.reason}") from exc
