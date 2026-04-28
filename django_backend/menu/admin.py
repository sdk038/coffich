from django.contrib import admin

from .models import Category, HeroSlide, Location, Product, Shop


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "price", "featured", "sort_order")
    list_filter = ("featured", "category")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "short_description")


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ("title", "sort_order")
    ordering = ("sort_order",)


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("city", "address", "sort_order", "is_published")
    list_filter = ("is_published",)
    search_fields = ("city", "address")
    prepopulated_fields = {"slug": ("city",)}
    ordering = ("sort_order", "id")


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not Shop.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
