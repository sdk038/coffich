from decimal import Decimal

from django.core.management.base import BaseCommand

from menu.models import Category, HeroSlide, Product, Shop


class Command(BaseCommand):
    help = "Создать демо-данные (категории, напитки, слайды, Shop)."

    def handle(self, *args, **options):
        cat_coffee, _ = Category.objects.get_or_create(
            slug="coffee",
            defaults={"name": "Кофе", "description": ""},
        )
        cat_other, _ = Category.objects.get_or_create(
            slug="other",
            defaults={"name": "Другое", "description": ""},
        )

        demo_products = [
            {
                "title": "Флэт уайт",
                "slug": "flat-white",
                "short_description": "Двойной эспрессо и бархатное молоко",
                "description": "<p>Классический флэт уайт с микропеной.</p>",
                "price": Decimal("18000"),
                "category": cat_coffee,
                "featured": True,
                "sort_order": 10,
            },
            {
                "title": "Капучино",
                "slug": "cappuccino",
                "short_description": "Эспрессо, молоко и плотная пенка",
                "description": "<p>Идеальный баланс кофе и молока.</p>",
                "price": Decimal("17000"),
                "category": cat_coffee,
                "featured": True,
                "sort_order": 20,
            },
            {
                "title": "Круассан",
                "slug": "croissant",
                "short_description": "Слоёная выпечка",
                "description": "<p>Свежая выпечка.</p>",
                "price": Decimal("12000"),
                "category": cat_other,
                "featured": False,
                "sort_order": 30,
            },
        ]

        for row in demo_products:
            Product.objects.update_or_create(slug=row["slug"], defaults=row)

        slides = [
            {
                "title": "Coffich",
                "subtitle": "Кофе, который хочется пить каждый день.",
                "button_text": "Меню",
                "button_link": "/menu",
                "sort_order": 0,
            },
            {
                "title": "Уютная атмосфера",
                "subtitle": "Заходите за эспрессо и разговором.",
                "button_text": "О нас",
                "button_link": "/about",
                "sort_order": 10,
            },
        ]
        for s in slides:
            HeroSlide.objects.update_or_create(
                title=s["title"],
                defaults={**s},
            )

        Shop.objects.update_or_create(
            pk=1,
            defaults={
                "shop_name": "Coffich",
                "tagline": "Кофейня в центре города",
                "about": "<p>Мы обжариваем зерно и готовим напитки с заботой.</p>",
                "address": "г. Ташкент, ул. Примерная, 1",
                "phone": "+998 90 000 00 00",
                "email": "hello@coffich.local",
                "hours": "Пн–Вс: 08:00 – 22:00",
                "map_embed_url": "",
            },
        )

        self.stdout.write(self.style.SUCCESS("Демо-данные готовы."))
