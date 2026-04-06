from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginCodeView, MeView, RegisterView, SendCodeView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/send-code/", SendCodeView.as_view(), name="send_code"),
    path("auth/login/", LoginCodeView.as_view(), name="token_obtain"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
]
