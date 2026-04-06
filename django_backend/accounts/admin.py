from django.contrib import admin

from .models import SmsCode


@admin.register(SmsCode)
class SmsCodeAdmin(admin.ModelAdmin):
    list_display = (
        "phone",
        "code",
        "purpose",
        "created_at",
        "expires_at",
        "consumed_at",
    )
    list_filter = ("purpose",)
    search_fields = ("phone",)
    readonly_fields = ("created_at",)
