from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CheckoutOrderView,
    LoginCodeView,
    MeView,
    OrderHistoryView,
    RegisterView,
    SendCodeView,
    TelegramStatusView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/send-code/", SendCodeView.as_view(), name="send_code"),
    path("auth/telegram-status/", TelegramStatusView.as_view(), name="telegram_status"),
    path("auth/login/", LoginCodeView.as_view(), name="token_obtain"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("orders/", OrderHistoryView.as_view(), name="order_history"),
    path("orders/checkout/", CheckoutOrderView.as_view(), name="checkout_order"),
]
