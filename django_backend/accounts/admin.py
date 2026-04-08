from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import (
    CustomerOrder,
    CustomerOrderItem,
    CustomerProfile,
    SmsCode,
    TelegramBinding,
    TelegramLoginRequest,
)


class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    extra = 0
    fields = ("latitude", "longitude", "location_updated_at")
    readonly_fields = ("location_updated_at",)


class TelegramBindingInline(admin.StackedInline):
    model = TelegramBinding
    extra = 0
    fields = (
        "chat_id",
        "username",
        "first_name",
        "last_name",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at")


admin.site.unregister(User)


@admin.register(User)
class CustomerUserAdmin(UserAdmin):
    inlines = (CustomerProfileInline, TelegramBindingInline)
    list_display = (
        "username",
        "first_name",
        "last_name",
        "date_joined",
        "last_login",
        "has_telegram_binding",
        "location_summary",
    )
    search_fields = ("username", "first_name", "last_name")

    @admin.display(boolean=True, description="Telegram")
    def has_telegram_binding(self, obj):
        return hasattr(obj, "telegram_binding")

    @admin.display(description="Локация")
    def location_summary(self, obj):
        profile = getattr(obj, "customer_profile", None)
        if not profile:
            return "Не указана"
        return f"{profile.latitude:.5f}, {profile.longitude:.5f}"


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


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "latitude", "longitude", "location_updated_at")
    search_fields = ("user__username", "user__first_name", "user__last_name")
    readonly_fields = ("location_updated_at",)


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


class CustomerOrderItemInline(admin.TabularInline):
    model = CustomerOrderItem
    extra = 0
    can_delete = False
    fields = ("product_key", "title", "price", "quantity", "line_sum")
    readonly_fields = ("product_key", "title", "price", "quantity", "line_sum")


@admin.register(CustomerOrder)
class CustomerOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "phone",
        "status",
        "total_sum",
        "created_at",
        "telegram_delivered_at",
    )
    list_filter = ("status", "created_at", "telegram_delivered_at")
    search_fields = ("phone", "customer_name", "user__username")
    readonly_fields = (
        "user",
        "customer_name",
        "phone",
        "latitude",
        "longitude",
        "total_sum",
        "telegram_delivered_at",
        "telegram_error",
        "created_at",
        "updated_at",
    )
    fields = (
        "user",
        "status",
        "customer_name",
        "phone",
        "latitude",
        "longitude",
        "total_sum",
        "note",
        "telegram_delivered_at",
        "telegram_error",
        "created_at",
        "updated_at",
    )
    inlines = (CustomerOrderItemInline,)
