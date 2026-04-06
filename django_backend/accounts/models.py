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
