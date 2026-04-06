from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"hero-slides", views.HeroSlideViewSet, basename="heroslide")

urlpatterns = [
    path("", include(router.urls)),
    path("shop/", views.ShopView.as_view(), name="shop"),
]
