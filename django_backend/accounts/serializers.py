from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from .models import CustomerOrder, CustomerOrderItem
from .utils import is_in_bukhara_delivery_zone, normalize_coordinate, normalize_phone


class NamePhoneSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    def to_internal_value(self, data):
        payload = data.copy() if hasattr(data, "copy") else dict(data)
        if "first_name" not in payload and "firstName" in payload:
            payload["first_name"] = payload["firstName"]
        if "last_name" not in payload and "lastName" in payload:
            payload["last_name"] = payload["lastName"]
        if "latitude" not in payload and "lat" in payload:
            payload["latitude"] = payload["lat"]
        if "longitude" not in payload and "lng" in payload:
            payload["longitude"] = payload["lng"]
        return super().to_internal_value(payload)

    def validate_phone(self, value):
        try:
            return normalize_phone(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e

    def validate_first_name(self, value):
        value = str(value).strip()
        if not value:
            raise serializers.ValidationError("Укажите имя")
        return value

    def validate_last_name(self, value):
        value = str(value).strip()
        if not value:
            raise serializers.ValidationError("Укажите фамилию")
        return value

    def validate_latitude(self, value):
        return normalize_coordinate(value, field_name="latitude")

    def validate_longitude(self, value):
        return normalize_coordinate(value, field_name="longitude")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not is_in_bukhara_delivery_zone(
            attrs["latitude"],
            attrs["longitude"],
            radius_km=getattr(settings, "BUKHARA_SERVICE_RADIUS_KM", 45.0),
        ):
            raise serializers.ValidationError(
                {"location": "Доставка доступна только пользователям из Бухары."}
            )
        return attrs


class RegisterSerializer(NamePhoneSerializer):
    pass


class SendCodeSerializer(NamePhoneSerializer):
    pass


class LoginCodeSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    code = serializers.CharField(max_length=4)

    def validate_phone(self, value):
        try:
            return normalize_phone(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e

    def validate_code(self, value):
        code = str(value).strip()
        if len(code) != 4 or not code.isdigit():
            raise serializers.ValidationError("Код должен состоять из 4 цифр")
        return code


class TelegramStatusSerializer(serializers.Serializer):
    request_id = serializers.UUIDField()

    def to_internal_value(self, data):
        payload = data.copy() if hasattr(data, "copy") else dict(data)
        if "request_id" not in payload and "requestId" in payload:
            payload["request_id"] = payload["requestId"]
        return super().to_internal_value(payload)


class OrderItemSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=64)
    title = serializers.CharField(max_length=255)
    price = serializers.IntegerField(min_value=0)
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class CheckoutOrderSerializer(serializers.Serializer):
    items = OrderItemSerializer(many=True)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Корзина пуста.")
        return value


class UserMeSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="username", read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "phone", "first_name", "last_name", "latitude", "longitude")

    def get_latitude(self, obj):
        try:
            return obj.customer_profile.latitude
        except ObjectDoesNotExist:
            return None

    def get_longitude(self, obj):
        try:
            return obj.customer_profile.longitude
        except ObjectDoesNotExist:
            return None


class CustomerOrderHistoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerOrderItem
        fields = ("id", "product_key", "title", "price", "quantity", "line_sum")


class CustomerOrderHistorySerializer(serializers.ModelSerializer):
    items = CustomerOrderHistoryItemSerializer(many=True, read_only=True)

    class Meta:
        model = CustomerOrder
        fields = (
            "id",
            "status",
            "customer_name",
            "phone",
            "total_sum",
            "note",
            "telegram_delivered_at",
            "telegram_error",
            "created_at",
            "updated_at",
            "items",
        )
