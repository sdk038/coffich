import random
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SmsCode
from .serializers import (
    CheckoutOrderSerializer,
    LoginCodeSerializer,
    RegisterSerializer,
    SendCodeSerializer,
    UserMeSerializer,
)
from .sms import SmsDeliveryError, send_login_code_sms
from .telegram import TelegramDeliveryError, send_order_to_telegram


def _is_mock_provider() -> bool:
    return getattr(settings, "SMS_PROVIDER", "auto").strip().lower() == "mock"


def issue_sms_code(user: User, phone: str, purpose: str = SmsCode.PURPOSE_AUTH) -> SmsCode:
    SmsCode.objects.filter(
        user=user,
        purpose=purpose,
        consumed_at__isnull=True,
    ).update(consumed_at=timezone.now())

    code = f"{random.randint(0, 9999):04d}"
    row = SmsCode.objects.create(
        user=user,
        phone=phone,
        code=code,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=5),
    )
    try:
        send_login_code_sms(phone, code)
    except SmsDeliveryError:
        row.delete()
        raise
    return row


def upsert_phone_user(phone: str, first_name: str, last_name: str):
    user, created = User.objects.get_or_create(
        username=phone,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
        },
    )
    if created:
        user.set_unusable_password()
        user.save(update_fields=["password"])
        return user, created

    dirty = False
    if first_name and user.first_name != first_name:
        user.first_name = first_name
        dirty = True
    if last_name and user.last_name != last_name:
        user.last_name = last_name
        dirty = True
    if dirty:
        user.save(update_fields=["first_name", "last_name"])
    return user, created


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        first_name = serializer.validated_data["first_name"].strip()
        last_name = serializer.validated_data["last_name"].strip()

        user, created = upsert_phone_user(phone, first_name, last_name)

        try:
            sms_row = issue_sms_code(user, phone)
        except SmsDeliveryError as e:
            return Response(
                {"sms": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        payload = {
            "message": "Код отправлен на телефон. Введите 4 цифры для входа.",
            "existingUser": not created,
        }
        if _is_mock_provider():
            payload["devCode"] = sms_row.code
        return Response(payload, status=status.HTTP_201_CREATED)


class SendCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        first_name = serializer.validated_data["first_name"].strip()
        last_name = serializer.validated_data["last_name"].strip()
        user, created = upsert_phone_user(phone, first_name, last_name)

        try:
            sms_row = issue_sms_code(user, phone)
        except SmsDeliveryError as e:
            return Response(
                {"sms": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        payload = {
            "message": "Код отправлен. Проверьте SMS.",
            "existingUser": not created,
        }
        if _is_mock_provider():
            payload["devCode"] = sms_row.code
        return Response(payload, status=status.HTTP_200_OK)


class LoginCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        code = serializer.validated_data["code"]

        user = User.objects.filter(username=phone).first()
        if not user:
            return Response(
                {"phone": "Сначала запросите код для этого номера."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sms = (
            SmsCode.objects.filter(
                user=user,
                phone=phone,
                purpose=SmsCode.PURPOSE_AUTH,
                consumed_at__isnull=True,
            )
            .order_by("-created_at")
            .first()
        )

        if not sms:
            return Response(
                {"code": "Сначала запросите код кнопкой «Отправить код»."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if sms.is_expired:
            return Response(
                {"code": "Код истёк. Запросите новый код."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if sms.code != code:
            return Response(
                {"code": "Неверный код."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sms.consumed_at = timezone.now()
        sms.save(update_fields=["consumed_at"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_200_OK,
        )


class MeView(generics.RetrieveAPIView):
    serializer_class = UserMeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CheckoutOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items = serializer.validated_data["items"]
        note = serializer.validated_data.get("note", "").strip()
        total_sum = sum(int(item["price"]) * int(item["quantity"]) for item in items)

        user = request.user
        customer_name = " ".join(
            part for part in [user.first_name.strip(), user.last_name.strip()] if part
        ).strip() or "Без имени"
        phone = user.username or "Не указан"

        try:
            send_order_to_telegram(
                customer_name=customer_name,
                phone=phone,
                items=items,
                total_sum=total_sum,
                note=note,
            )
        except TelegramDeliveryError as exc:
            return Response(
                {"telegram": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"message": "Заказ отправлен в кофейню. Мы скоро свяжемся с вами."},
            status=status.HTTP_200_OK,
        )
