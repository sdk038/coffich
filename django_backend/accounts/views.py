import random
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    CustomerOrder,
    CustomerOrderItem,
    CustomerProfile,
    SmsCode,
    TelegramBinding,
    TelegramLoginRequest,
)
from .serializers import (
    CheckoutOrderSerializer,
    CustomerOrderHistorySerializer,
    LoginCodeSerializer,
    RegisterSerializer,
    SendCodeSerializer,
    TelegramStatusSerializer,
    UserMeSerializer,
)
from .telegram import (
    TelegramDeliveryError,
    build_telegram_start_url,
    find_start_update,
    is_telegram_auth_configured,
    send_auth_code_to_telegram,
    send_order_to_telegram,
)
from .utils import is_in_bukhara_delivery_zone


def get_user_telegram_binding(user: User) -> TelegramBinding | None:
    try:
        return user.telegram_binding
    except TelegramBinding.DoesNotExist:
        return None


def get_customer_profile(user: User) -> CustomerProfile | None:
    try:
        return user.customer_profile
    except CustomerProfile.DoesNotExist:
        return None


def issue_auth_code(
    user: User,
    phone: str,
    chat_id: str,
    purpose: str = SmsCode.PURPOSE_AUTH,
) -> SmsCode:
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
        send_auth_code_to_telegram(chat_id, code)
    except TelegramDeliveryError:
        row.delete()
        raise
    return row


def issue_local_auth_code(
    user: User,
    phone: str,
    purpose: str = SmsCode.PURPOSE_AUTH,
) -> SmsCode:
    SmsCode.objects.filter(
        user=user,
        purpose=purpose,
        consumed_at__isnull=True,
    ).update(consumed_at=timezone.now())

    return SmsCode.objects.create(
        user=user,
        phone=phone,
        code=f"{random.randint(0, 9999):04d}",
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=5),
    )


def upsert_customer_profile(
    user: User, *, latitude: float, longitude: float
) -> CustomerProfile:
    profile = get_customer_profile(user)
    if profile is None:
        profile = CustomerProfile(user=user, latitude=latitude, longitude=longitude)
    else:
        profile.latitude = latitude
        profile.longitude = longitude
    profile.save()
    return profile


def upsert_phone_user(
    phone: str,
    first_name: str,
    last_name: str,
    *,
    latitude: float,
    longitude: float,
):
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
        upsert_customer_profile(user, latitude=latitude, longitude=longitude)
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
    upsert_customer_profile(user, latitude=latitude, longitude=longitude)
    return user, created


def upsert_telegram_binding(
    user: User,
    *,
    chat_id: str,
    username: str = "",
    first_name: str = "",
    last_name: str = "",
) -> TelegramBinding:
    conflicting = (
        TelegramBinding.objects.exclude(user=user).filter(chat_id=chat_id).first()
    )
    if conflicting:
        raise TelegramDeliveryError(
            "Этот Telegram уже привязан к другому аккаунту."
        )

    binding = get_user_telegram_binding(user)
    if binding is None:
        binding = TelegramBinding(user=user, chat_id=chat_id)
    else:
        binding.chat_id = chat_id

    binding.username = username or binding.username
    binding.first_name = first_name or binding.first_name
    binding.last_name = last_name or binding.last_name
    binding.save()
    return binding


def create_telegram_login_request(user: User, phone: str) -> TelegramLoginRequest:
    now = timezone.now()
    TelegramLoginRequest.objects.filter(
        user=user,
        phone=phone,
        code_sent_at__isnull=True,
        expires_at__gt=now,
    ).update(expires_at=now)

    existing_binding = get_user_telegram_binding(user)
    return TelegramLoginRequest.objects.create(
        user=user,
        phone=phone,
        start_token=f"auth_{secrets.token_urlsafe(18)}",
        telegram_binding=existing_binding,
        linked_at=now if existing_binding else None,
        expires_at=now + timedelta(minutes=10),
    )


def sync_telegram_login_request(
    login_request: TelegramLoginRequest,
) -> TelegramLoginRequest:
    if login_request.is_expired:
        return login_request

    if not login_request.telegram_binding_id:
        start_data = find_start_update(login_request.start_token)
        if start_data and start_data.get("chat_id"):
            binding = upsert_telegram_binding(login_request.user, **start_data)
            login_request.telegram_binding = binding
            login_request.linked_at = timezone.now()
            login_request.save(update_fields=["telegram_binding", "linked_at"])

    if login_request.telegram_binding_id and login_request.code_sent_at is None:
        issue_auth_code(
            login_request.user,
            login_request.phone,
            login_request.telegram_binding.chat_id,
        )
        now = timezone.now()
        login_request.code_sent_at = now
        if login_request.linked_at is None:
            login_request.linked_at = now
        login_request.save(update_fields=["code_sent_at", "linked_at"])

    return login_request


def build_telegram_login_payload(
    login_request: TelegramLoginRequest, *, created: bool
) -> dict:
    payload = {
        "message": (
            "Код отправлен в Telegram. Проверьте сообщения от бота."
            if login_request.code_sent_at
            else "Откройте Telegram-бота, нажмите Start и вернитесь на сайт."
        ),
        "existingUser": not created,
        "requestId": str(login_request.public_id),
        "telegramLinked": bool(login_request.telegram_binding_id),
        "codeSent": bool(login_request.code_sent_at),
    }
    if not login_request.telegram_binding_id:
        payload["telegramBotUrl"] = build_telegram_start_url(login_request.start_token)
    return payload


def build_dev_fallback_payload(
    user: User,
    phone: str,
    *,
    created: bool,
    request_id: str | None = None,
) -> dict:
    local_code = issue_local_auth_code(user, phone)
    return {
        "message": (
            "Telegram временно недоступен в локальной сети. "
            "Используйте тестовый код ниже, чтобы продолжить вход."
        ),
        "existingUser": not created,
        "requestId": request_id or "",
        "telegramLinked": False,
        "codeSent": True,
        "devCode": local_code.code,
        "fallbackMode": "dev",
    }


def create_customer_order(
    *,
    user: User,
    items: list[dict],
    note: str,
    total_sum: int,
    customer_name: str,
    phone: str,
    latitude: float,
    longitude: float,
) -> CustomerOrder:
    with transaction.atomic():
        order = CustomerOrder.objects.create(
            user=user,
            customer_name=customer_name,
            phone=phone,
            latitude=latitude,
            longitude=longitude,
            total_sum=total_sum,
            note=note,
        )
        CustomerOrderItem.objects.bulk_create(
            [
                CustomerOrderItem(
                    order=order,
                    product_key=item["key"],
                    title=item["title"],
                    price=int(item["price"]),
                    quantity=int(item["quantity"]),
                    line_sum=int(item["price"]) * int(item["quantity"]),
                )
                for item in items
            ]
        )
    return order


def start_telegram_login(user: User, phone: str, *, created: bool) -> dict:
    if not is_telegram_auth_configured():
        if settings.DEBUG:
            return build_dev_fallback_payload(user, phone, created=created)
        raise TelegramDeliveryError(
            "Telegram-вход не настроен: укажите TELEGRAM_BOT_TOKEN."
        )

    login_request = create_telegram_login_request(user, phone)
    if login_request.telegram_binding_id:
        try:
            login_request = sync_telegram_login_request(login_request)
        except TelegramDeliveryError:
            # If the stored chat can no longer receive messages, fall back to
            # a fresh Start flow for this login attempt instead of hard-failing.
            login_request.telegram_binding = None
            login_request.linked_at = None
            login_request.save(update_fields=["telegram_binding", "linked_at"])
    try:
        return build_telegram_login_payload(login_request, created=created)
    except TelegramDeliveryError:
        if settings.DEBUG:
            return build_dev_fallback_payload(
                user,
                phone,
                created=created,
                request_id=str(login_request.public_id),
            )
        raise


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        first_name = serializer.validated_data["first_name"].strip()
        last_name = serializer.validated_data["last_name"].strip()
        latitude = serializer.validated_data["latitude"]
        longitude = serializer.validated_data["longitude"]

        user, created = upsert_phone_user(
            phone,
            first_name,
            last_name,
            latitude=latitude,
            longitude=longitude,
        )

        try:
            payload = start_telegram_login(user, phone, created=created)
        except TelegramDeliveryError as e:
            return Response(
                {"telegram": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(payload, status=status.HTTP_201_CREATED)


class SendCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        first_name = serializer.validated_data["first_name"].strip()
        last_name = serializer.validated_data["last_name"].strip()
        latitude = serializer.validated_data["latitude"]
        longitude = serializer.validated_data["longitude"]
        user, created = upsert_phone_user(
            phone,
            first_name,
            last_name,
            latitude=latitude,
            longitude=longitude,
        )

        try:
            payload = start_telegram_login(user, phone, created=created)
        except TelegramDeliveryError as e:
            return Response(
                {"telegram": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(payload, status=status.HTTP_200_OK)


class TelegramStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        serializer = TelegramStatusSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        request_id = serializer.validated_data["request_id"]

        login_request = (
            TelegramLoginRequest.objects.select_related("telegram_binding", "user")
            .filter(public_id=request_id)
            .first()
        )
        if not login_request:
            return Response(
                {"requestId": "Запрос на вход не найден."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if login_request.is_expired:
            return Response(
                {"requestId": "Сессия входа истекла. Запросите новый код."},
                status=status.HTTP_410_GONE,
            )

        try:
            login_request = sync_telegram_login_request(login_request)
        except TelegramDeliveryError as exc:
            return Response(
                {"telegram": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            build_telegram_login_payload(login_request, created=False),
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
                {"phone": "Сначала начните вход через Telegram."},
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
                {"code": "Откройте Telegram-бота, нажмите Start и дождитесь кода."},
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


class OrderHistoryView(generics.ListAPIView):
    serializer_class = CustomerOrderHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return (
            CustomerOrder.objects.filter(user=self.request.user)
            .prefetch_related("items")
            .order_by("-created_at", "-id")
        )


class CheckoutOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items = serializer.validated_data["items"]
        note = serializer.validated_data.get("note", "").strip()
        total_sum = sum(int(item["price"]) * int(item["quantity"]) for item in items)

        user = request.user
        profile = get_customer_profile(user)
        if not profile:
            return Response(
                {
                    "location": (
                        "Не удалось определить вашу локацию. "
                        "Войдите заново и разрешите доступ к геопозиции."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not is_in_bukhara_delivery_zone(
            profile.latitude,
            profile.longitude,
            radius_km=getattr(settings, "BUKHARA_SERVICE_RADIUS_KM", 45.0),
        ):
            return Response(
                {"location": "Доставка доступна только в Бухаре."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        customer_name = " ".join(
            part for part in [user.first_name.strip(), user.last_name.strip()] if part
        ).strip() or "Без имени"
        phone = user.username or "Не указан"
        order = create_customer_order(
            user=user,
            items=items,
            note=note,
            total_sum=total_sum,
            customer_name=customer_name,
            phone=phone,
            latitude=profile.latitude,
            longitude=profile.longitude,
        )

        try:
            send_order_to_telegram(
                customer_name=customer_name,
                phone=phone,
                items=items,
                total_sum=total_sum,
                note=note,
                latitude=profile.latitude,
                longitude=profile.longitude,
            )
            order.telegram_delivered_at = timezone.now()
            order.telegram_error = ""
            order.save(update_fields=["telegram_delivered_at", "telegram_error"])
        except TelegramDeliveryError as exc:
            order.telegram_error = str(exc)
            order.save(update_fields=["telegram_error"])
            return Response(
                {
                    "message": (
                        "Заказ сохранён. Telegram кофейни временно недоступен, "
                        "но мы получили ваш заказ и обработаем его вручную."
                    ),
                    "warning": str(exc),
                    "orderId": order.id,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "message": "Заказ отправлен в кофейню. Мы скоро свяжемся с вами.",
                "orderId": order.id,
            },
            status=status.HTTP_200_OK,
        )
