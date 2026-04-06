from rest_framework import serializers

from .models import Category, HeroSlide, Product, Shop


class MediaUrlMixin:
    """Отдаём относительный URL (`/media/...`) — фронт склеивает с базой API / прокси."""

    def _image_payload(self, obj, field_name):
        field = getattr(obj, field_name, None)
        if not field or not field.name:
            return None
        return {"url": field.url}


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description")


class ProductSerializer(MediaUrlMixin, serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    document_id = serializers.IntegerField(source="id", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "document_id",
            "title",
            "slug",
            "description",
            "short_description",
            "price",
            "image",
            "category",
            "featured",
            "sort_order",
        )

    def get_image(self, obj):
        return self._image_payload(obj, "image")


class HeroSlideSerializer(MediaUrlMixin, serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = HeroSlide
        fields = (
            "id",
            "title",
            "subtitle",
            "image",
            "button_text",
            "button_link",
            "sort_order",
        )

    def get_image(self, obj):
        return self._image_payload(obj, "image")


class ShopSerializer(MediaUrlMixin, serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            "id",
            "shop_name",
            "tagline",
            "about",
            "address",
            "phone",
            "email",
            "hours",
            "map_embed_url",
            "cover_image",
        )

    def get_cover_image(self, obj):
        return self._image_payload(obj, "cover_image")
