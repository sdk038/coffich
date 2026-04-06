import re


def normalize_phone(phone: str) -> str:
    """
    Приводит номер к виду +998XXXXXXXXX (Узбекистан, мобильный).
    Принимает +998..., 998..., 9XXXXXXXX (9 цифр с 9).
    """
    if not phone or not str(phone).strip():
        raise ValueError("Укажите номер телефона")
    s = "".join(c for c in str(phone) if c.isdigit() or c == "+")
    digits = "".join(c for c in s if c.isdigit())
    if not digits:
        raise ValueError("Некорректный номер")
    if digits.startswith("998") and len(digits) >= 12:
        core = digits[:12]
    elif len(digits) == 9:
        core = "998" + digits
    elif len(digits) == 12 and digits.startswith("998"):
        core = digits
    else:
        raise ValueError(
            "Ожидается узбекский мобильный номер, например +998 90 123 45 67"
        )
    return "+" + core


def is_valid_phone_display(phone: str) -> bool:
    try:
        normalize_phone(phone)
        return True
    except ValueError:
        return False
