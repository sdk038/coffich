from django.contrib import admin

from .models import SmsCode, TelegramBinding, TelegramLoginRequest


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


@admin.register(TelegramBinding)
class TelegramBindingAdmin(admin.ModelAdmin):
    list_display = ("user", "chat_id", "username", "updated_at")
    search_fields = ("user__username", "chat_id", "username")
    readonly_fields = ("created_at", "updated_at")


@admin.register(TelegramLoginRequest)
class TelegramLoginRequestAdmin(admin.ModelAdmin):
    list_display = (
        "phone",
        "public_id",
        "telegram_binding",
        "linked_at",
        "code_sent_at",
        "expires_at",
    )
    search_fields = ("phone", "public_id", "start_token")
    readonly_fields = ("public_id", "start_token", "created_at")
