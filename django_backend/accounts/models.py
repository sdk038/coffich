import uuid

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class SmsCode(models.Model):
    PURPOSE_AUTH = "auth"
    PURPOSE_CHOICES = ((PURPOSE_AUTH, "Auth"),)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sms_codes")
    phone = models.CharField(max_length=16, db_index=True)
    code = models.CharField(max_length=4)
    purpose = models.CharField(max_length=32, choices=PURPOSE_CHOICES, default=PURPOSE_AUTH)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_usable(self) -> bool:
        return self.consumed_at is None and not self.is_expired

    def __str__(self):
        return f"{self.phone} ({self.code})"


class TelegramBinding(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="telegram_binding"
    )
    chat_id = models.CharField(max_length=64, unique=True, db_index=True)
    username = models.CharField(max_length=255, blank=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.username or self.chat_id


class CustomerProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="customer_profile"
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    location_updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} location"


class TelegramLoginRequest(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="telegram_login_requests"
    )
    phone = models.CharField(max_length=16, db_index=True)
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    start_token = models.CharField(max_length=64, unique=True, db_index=True)
    telegram_binding = models.ForeignKey(
        TelegramBinding,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="login_requests",
    )
    linked_at = models.DateTimeField(blank=True, null=True)
    code_sent_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_ready(self) -> bool:
        return self.telegram_binding_id is not None and self.code_sent_at is not None

    def __str__(self):
        return f"{self.phone} -> {self.public_id}"
