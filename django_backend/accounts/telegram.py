import json
import logging
import os
import ssl
from urllib import parse
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


def is_telegram_auth_configured() -> bool:
    return bool(_value("TELEGRAM_BOT_TOKEN"))


def _telegram_api_url(method: str) -> str:
    token = _value("TELEGRAM_BOT_TOKEN")
    if not token:
        raise TelegramDeliveryError("Telegram не настроен: укажите TELEGRAM_BOT_TOKEN.")
    return f"https://api.telegram.org/bot{token}/{method}"


def _telegram_api_request(method: str, *, payload: dict | None = None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(
        url=_telegram_api_url(method),
        data=data,
        method="POST" if payload is not None else "GET",
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

    try:
        data = json.loads(body or "{}")
    except Exception as exc:
        raise TelegramDeliveryError("Telegram вернул некорректный ответ.") from exc

    if not data.get("ok"):
        description = str(data.get("description") or "Неизвестная ошибка Telegram")
        raise TelegramDeliveryError(f"Telegram ошибка: {description}")
    return data.get("result")


def _send_message(chat_id: str, text: str) -> None:
    _telegram_api_request(
        "sendMessage",
        payload={
            "chat_id": str(chat_id),
            "text": text,
        },
    )


def get_telegram_bot_username() -> str:
    username = _value("TELEGRAM_BOT_USERNAME")
    if username:
        return username.lstrip("@")
    result = _telegram_api_request("getMe")
    username = str((result or {}).get("username") or "").strip()
    if not username:
        raise TelegramDeliveryError(
            "Не удалось определить username Telegram-бота. Укажите TELEGRAM_BOT_USERNAME."
        )
    return username


def build_telegram_start_url(start_token: str) -> str:
    username = get_telegram_bot_username()
    return f"https://t.me/{username}?start={parse.quote(start_token)}"


def fetch_telegram_updates(limit: int = 100) -> list[dict]:
    query = parse.urlencode({"limit": max(1, min(limit, 100)), "timeout": 0})
    url = f"{_telegram_api_url('getUpdates')}?{query}"
    req = request.Request(
        url=url,
        method="GET",
        headers={"Accept": "application/json"},
    )
    try:
        with _open_url(req, timeout=15) as resp:
            body = resp.read().decode("utf-8") if resp else ""
            if resp.status >= 300:
                raise TelegramDeliveryError(
                    f"Telegram ошибка: HTTP {resp.status} {body[:180]}"
                )
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

    try:
        data = json.loads(body or "{}")
    except Exception as exc:
        raise TelegramDeliveryError("Telegram вернул некорректный ответ.") from exc

    if not data.get("ok"):
        description = str(data.get("description") or "Неизвестная ошибка Telegram")
        raise TelegramDeliveryError(f"Telegram ошибка: {description}")
    result = data.get("result")
    return result if isinstance(result, list) else []


def find_start_update(start_token: str) -> dict | None:
    expected = str(start_token).strip()
    if not expected:
        return None

    for item in reversed(fetch_telegram_updates()):
        message = item.get("message") or item.get("edited_message") or {}
        text = str(message.get("text") or "").strip()
        if not text.startswith("/start"):
            continue
        parts = text.split(maxsplit=1)
        payload = parts[1].strip() if len(parts) == 2 else ""
        if payload != expected:
            continue
        chat = message.get("chat") or {}
        from_user = message.get("from") or {}
        return {
            "chat_id": str(chat.get("id") or "").strip(),
            "username": str(from_user.get("username") or "").strip(),
            "first_name": str(from_user.get("first_name") or "").strip(),
            "last_name": str(from_user.get("last_name") or "").strip(),
        }
    return None


def _build_auth_message(code: str) -> str:
    return (
        "Coffich\n"
        f"Ваш код входа: {code}\n\n"
        "Введите эти 4 цифры на сайте, чтобы завершить вход."
    )


def send_auth_code_to_telegram(chat_id: str, code: str) -> None:
    if not chat_id:
        raise TelegramDeliveryError("Telegram не привязан к аккаунту.")
    _send_message(chat_id, _build_auth_message(code))
    logger.info("Auth code sent to Telegram chat %s", chat_id)


def _build_location_line(latitude: float, longitude: float) -> str:
    maps_url = f"https://maps.google.com/?q={latitude},{longitude}"
    return f"Локация: {latitude:.6f}, {longitude:.6f}\nКарта: {maps_url}"


def _build_order_message(
    *,
    customer_name: str,
    phone: str,
    items: list[dict],
    total_sum: int,
    note: str = "",
    latitude: float | None = None,
    longitude: float | None = None,
) -> str:
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

    if latitude is not None and longitude is not None:
        lines.extend(["", _build_location_line(latitude, longitude)])

    if note:
        lines.extend(["", f"Комментарий: {note}"])
    return "\n".join(lines)


def send_order_to_telegram(
    *,
    customer_name: str,
    phone: str,
    items: list[dict],
    total_sum: int,
    note: str = "",
    latitude: float | None = None,
    longitude: float | None = None,
) -> None:
    token = _value("TELEGRAM_BOT_TOKEN")
    chat_id = _value("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        raise TelegramDeliveryError(
            "Telegram не настроен: укажите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env backend."
        )
    _send_message(
        chat_id,
        _build_order_message(
            customer_name=customer_name,
            phone=phone,
            items=items,
            total_sum=total_sum,
            note=note,
            latitude=latitude,
            longitude=longitude,
        ),
    )
    logger.info("Order sent to Telegram chat %s", chat_id)
