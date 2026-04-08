from django.contrib.auth.models import User
from rest_framework import serializers

from .utils import normalize_phone


class NamePhoneSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

    def to_internal_value(self, data):
        payload = data.copy() if hasattr(data, "copy") else dict(data)
        if "first_name" not in payload and "firstName" in payload:
            payload["first_name"] = payload["firstName"]
        if "last_name" not in payload and "lastName" in payload:
            payload["last_name"] = payload["lastName"]
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

    class Meta:
        model = User
        fields = ("id", "phone", "first_name", "last_name")
