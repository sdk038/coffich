import random
from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SmsCode
from .serializers import (
    LoginCodeSerializer,
    RegisterSerializer,
    SendCodeSerializer,
    UserMeSerializer,
)
from .sms import SmsDeliveryError, send_login_code_sms


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


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        first_name = serializer.validated_data["first_name"].strip()
        last_name = serializer.validated_data["last_name"].strip()

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
        else:
            dirty = False
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                dirty = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                dirty = True
            if dirty:
                user.save(update_fields=["first_name", "last_name"])

        try:
            issue_sms_code(user, phone)
        except SmsDeliveryError as e:
            return Response(
                {"sms": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                "message": "Код отправлен на телефон. Введите 4 цифры для входа.",
                "existingUser": not created,
            },
            status=status.HTTP_201_CREATED,
        )


class SendCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]

        user = User.objects.filter(username=phone).first()
        if not user:
            return Response(
                {"phone": "Номер не найден. Сначала зарегистрируйтесь."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            issue_sms_code(user, phone)
        except SmsDeliveryError as e:
            return Response(
                {"sms": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"message": "Код отправлен. Проверьте SMS."},
            status=status.HTTP_200_OK,
        )


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
                {"phone": "Номер не найден. Сначала зарегистрируйтесь."},
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

        if not sms or sms.is_expired:
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
