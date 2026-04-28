from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import HeroSlide, Location, Product, Shop
from .serializers import (
    HeroSlideSerializer,
    LocationSerializer,
    ProductSerializer,
    ShopSerializer,
)


def root(_request):
    """Корень сервера — не API; данные только под /api/."""
    html = """<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>Coffich API</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem;line-height:1.5}
code{background:#f0f0f0;padding:0.1em 0.3em;border-radius:4px}</style></head>
<body>
<h1>Coffich — backend</h1>
<p>Сервер работает. JSON-API находится по префиксу <code>/api/</code>, не в корне.</p>
<ul>
<li><a href="/api/products/">GET /api/products/</a></li>
<li><a href="/api/hero-slides/">GET /api/hero-slides/</a></li>
<li><a href="/api/shop/">GET /api/shop/</a></li>
<li><a href="/api/locations/">GET /api/locations/</a></li>
<li><a href="/admin/">Админка Django</a></li>
</ul>
</body></html>"""
    return HttpResponse(html)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = None

    def get_queryset(self):
        qs = Product.objects.select_related("category").all()
        featured = self.request.query_params.get("featured")
        if featured in ("true", "1", "True", "yes"):
            qs = qs.filter(featured=True)
        return qs.order_by("sort_order", "id")


class HeroSlideViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HeroSlide.objects.all().order_by("sort_order", "id")
    serializer_class = HeroSlideSerializer
    pagination_class = None


class ShopView(APIView):
    """Один объект Shop (создаётся при первом запросе, если пусто)."""

    def get(self, request):
        shop, _ = Shop.objects.get_or_create(
            pk=1,
            defaults={"shop_name": "Coffich"},
        )
        return Response(ShopSerializer(shop, context={"request": request}).data)


class LocationListView(APIView):
    """Опубликованные точки сети по городам."""

    def get(self, request):
        qs = Location.objects.filter(is_published=True).order_by("sort_order", "id")
        return Response(LocationSerializer(qs, many=True).data)
