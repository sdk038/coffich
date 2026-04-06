from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=500, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    featured = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title


class HeroSlide(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.TextField(blank=True)
    image = models.ImageField(upload_to="hero/", blank=True, null=True)
    button_text = models.CharField(max_length=100, default="Меню")
    button_link = models.CharField(max_length=500, default="/menu")
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "hero slide"
        verbose_name_plural = "hero slides"

    def __str__(self):
        return self.title


class Shop(models.Model):
    """Единственная запись с id=1 — данные кофейни для сайта."""

    shop_name = models.CharField(max_length=255, default="Coffich")
    tagline = models.CharField(max_length=500, blank=True)
    about = models.TextField(blank=True)
    address = models.CharField(max_length=500, blank=True)
    phone = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    hours = models.TextField(blank=True)
    map_embed_url = models.URLField(blank=True)
    cover_image = models.ImageField(upload_to="shop/", blank=True, null=True)

    class Meta:
        verbose_name = "shop"

    def __str__(self):
        return self.shop_name
