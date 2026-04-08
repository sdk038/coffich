import re
from math import asin, cos, radians, sin, sqrt

BUKHARA_CENTER_LAT = 39.7747
BUKHARA_CENTER_LNG = 64.4286


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


def normalize_coordinate(value, *, field_name: str) -> float:
    try:
        coord = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Укажите корректную координату: {field_name}") from exc
    return coord


def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371.0
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    a = sin(d_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(d_lng / 2) ** 2
    return 2 * radius_km * asin(sqrt(a))


def is_in_bukhara_delivery_zone(
    latitude: float,
    longitude: float,
    *,
    radius_km: float = 45.0,
) -> bool:
    distance = haversine_distance_km(
        latitude,
        longitude,
        BUKHARA_CENTER_LAT,
        BUKHARA_CENTER_LNG,
    )
    return distance <= float(radius_km)
