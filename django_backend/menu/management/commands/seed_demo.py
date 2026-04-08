from decimal import Decimal

from django.core.management.base import BaseCommand

from menu.models import Category, HeroSlide, Product, Shop


class Command(BaseCommand):
    help = "Создать демо-данные (категории, напитки, слайды, Shop)."

    def handle(self, *args, **options):
        categories = {
            "signature": {
                "name": "Авторские напитки",
                "description": "Фирменные рецепты, где классика встречается с сезонными вкусами.",
            },
            "espresso-classics": {
                "name": "Эспрессо-классика",
                "description": "Сбалансированные кофейные напитки на каждый день.",
            },
            "cold-drinks": {
                "name": "Холодные напитки",
                "description": "Освежающие позиции для жаркого дня и лёгких встреч.",
            },
            "bakery": {
                "name": "Выпечка и десерты",
                "description": "Свежая выпечка, которая отлично сочетается с кофе.",
            },
        }

        created_categories = {}
        for slug, payload in categories.items():
            created_categories[slug], _ = Category.objects.update_or_create(
                slug=slug,
                defaults=payload,
            )

        demo_products = [
            {
                "title": "Coffich Honey",
                "slug": "coffich-honey",
                "short_description": "Эспрессо, сливочный крем и лёгкая медовая нота",
                "description": (
                    "<p>Фирменный напиток кофейни: двойной эспрессо, кремовая текстура "
                    "и мягкий медовый акцент в послевкусии.</p>"
                ),
                "price": Decimal("29000"),
                "category": created_categories["signature"],
                "featured": True,
                "sort_order": 10,
            },
            {
                "title": "Апельсиновый раф",
                "slug": "orange-raf",
                "short_description": "Раф на сливках с цедрой апельсина и ванилью",
                "description": (
                    "<p>Мягкий авторский раф с натуральной цитрусовой свежестью "
                    "и тёплым ванильным ароматом.</p>"
                ),
                "price": Decimal("31000"),
                "category": created_categories["signature"],
                "featured": True,
                "sort_order": 20,
            },
            {
                "title": "Фисташковый латте",
                "slug": "pistachio-latte",
                "short_description": "Латте с фисташковым сиропом и плотной пеной",
                "description": (
                    "<p>Напиток для тех, кто любит мягкий кофе с насыщенным ореховым "
                    "характером и шелковистой текстурой.</p>"
                ),
                "price": Decimal("30000"),
                "category": created_categories["signature"],
                "featured": True,
                "sort_order": 30,
            },
            {
                "title": "Эспрессо",
                "slug": "espresso",
                "short_description": "Короткий насыщенный шот с плотным вкусом",
                "description": (
                    "<p>Чистый вкус зерна без лишнего: яркая ароматика, плотное тело "
                    "и уверенное послевкусие.</p>"
                ),
                "price": Decimal("14000"),
                "category": created_categories["espresso-classics"],
                "featured": False,
                "sort_order": 40,
            },
            {
                "title": "Американо",
                "slug": "americano",
                "short_description": "Эспрессо и горячая вода для мягкого баланса",
                "description": (
                    "<p>Универсальный вариант на каждый день: чистый кофейный профиль "
                    "и комфортная крепость.</p>"
                ),
                "price": Decimal("16000"),
                "category": created_categories["espresso-classics"],
                "featured": False,
                "sort_order": 50,
            },
            {
                "title": "Капучино",
                "slug": "cappuccino",
                "short_description": "Эспрессо, молоко и воздушная сливочная пенка",
                "description": (
                    "<p>Сбалансированный вкус с мягкой сладостью молока и узнаваемым "
                    "кофейным характером.</p>"
                ),
                "price": Decimal("22000"),
                "category": created_categories["espresso-classics"],
                "featured": True,
                "sort_order": 60,
            },
            {
                "title": "Флэт уайт",
                "slug": "flat-white",
                "short_description": "Двойной эспрессо и бархатное молоко",
                "description": (
                    "<p>Более кофейный и плотный по вкусу, чем латте: любимец тех, "
                    "кто выбирает насыщенность и микропену.</p>"
                ),
                "price": Decimal("24000"),
                "category": created_categories["espresso-classics"],
                "featured": True,
                "sort_order": 70,
            },
            {
                "title": "Латте",
                "slug": "latte",
                "short_description": "Мягкий молочный кофе для спокойного утра",
                "description": (
                    "<p>Нежный напиток с деликатным кофейным вкусом и комфортной "
                    "молочной текстурой.</p>"
                ),
                "price": Decimal("23000"),
                "category": created_categories["espresso-classics"],
                "featured": False,
                "sort_order": 80,
            },
            {
                "title": "Айс латте",
                "slug": "iced-latte",
                "short_description": "Холодный латте со льдом и мягкой кремовой подачей",
                "description": (
                    "<p>Освежающий и лёгкий вариант для тёплого дня, когда хочется кофе "
                    "без тяжести.</p>"
                ),
                "price": Decimal("26000"),
                "category": created_categories["cold-drinks"],
                "featured": False,
                "sort_order": 90,
            },
            {
                "title": "Эспрессо-тоник",
                "slug": "espresso-tonic",
                "short_description": "Игристый тоник, эспрессо и лёгкая цитрусовая горечь",
                "description": (
                    "<p>Контрастный напиток с бодрящей кислинкой и сухим освежающим "
                    "послевкусием.</p>"
                ),
                "price": Decimal("28000"),
                "category": created_categories["cold-drinks"],
                "featured": True,
                "sort_order": 100,
            },
            {
                "title": "Колд брю",
                "slug": "cold-brew",
                "short_description": "Кофе холодного настаивания с чистым вкусом",
                "description": (
                    "<p>Медленное холодное заваривание раскрывает сладость и делает "
                    "вкус особенно мягким.</p>"
                ),
                "price": Decimal("25000"),
                "category": created_categories["cold-drinks"],
                "featured": False,
                "sort_order": 110,
            },
            {
                "title": "Круассан с миндальным кремом",
                "slug": "almond-croissant",
                "short_description": "Слоёный круассан с нежной ореховой начинкой",
                "description": (
                    "<p>Свежеиспечённый круассан с мягким миндальным кремом и лёгкой "
                    "карамельной корочкой.</p>"
                ),
                "price": Decimal("21000"),
                "category": created_categories["bakery"],
                "featured": False,
                "sort_order": 120,
            },
            {
                "title": "Чизкейк сан-себастьян",
                "slug": "san-sebastian-cheesecake",
                "short_description": "Нежный чизкейк с карамельной корочкой",
                "description": (
                    "<p>Кремовый десерт с деликатной текстурой, который отлично "
                    "подчеркивает молочные кофейные напитки.</p>"
                ),
                "price": Decimal("26000"),
                "category": created_categories["bakery"],
                "featured": False,
                "sort_order": 130,
            },
            {
                "title": "Банановый хлеб",
                "slug": "banana-bread",
                "short_description": "Тёплая домашняя выпечка с ореховой крошкой",
                "description": (
                    "<p>Мягкий кекс с бананом, корицей и хрустящей ореховой крошкой. "
                    "Идеален к фильтр-кофе и американо.</p>"
                ),
                "price": Decimal("18000"),
                "category": created_categories["bakery"],
                "featured": False,
                "sort_order": 140,
            },
        ]

        for row in demo_products:
            Product.objects.update_or_create(slug=row["slug"], defaults=row)

        slides = [
            {
                "title": "Coffich",
                "subtitle": (
                    "Уютная городская кофейня со specialty-зерном, авторскими напитками "
                    "и выпечкой, которую хочется заказать ещё до первого глотка."
                ),
                "button_text": "Открыть меню",
                "button_link": "/menu",
                "sort_order": 0,
            },
            {
                "title": "Завтрак, встреча, пауза",
                "subtitle": (
                    "Заходите утром за бодрым капучино, днём за холодным "
                    "эспрессо-тоником, а вечером — за десертом и спокойной атмосферой."
                ),
                "button_text": "Наша история",
                "button_link": "/about",
                "sort_order": 10,
            },
            {
                "title": "Доставка и самовывоз",
                "subtitle": (
                    "Соберите любимый заказ в корзине, войдите по коду из SMS "
                    "и заберите напиток без очереди."
                ),
                "button_text": "Связаться",
                "button_link": "/contact",
                "sort_order": 20,
            },
        ]
        for slide in slides:
            HeroSlide.objects.update_or_create(
                title=slide["title"],
                defaults={**slide},
            )

        Shop.objects.update_or_create(
            pk=1,
            defaults={
                "shop_name": "Coffich",
                "tagline": "Кофе, десерты и спокойная атмосфера в ритме большого города.",
                "about": (
                    "<p><strong>Coffich</strong> — современная городская кофейня, где "
                    "specialty-зерно, понятный сервис и тёплая атмосфера встречаются "
                    "в одном пространстве. Мы создаём место, куда удобно забежать за "
                    "быстрым эспрессо утром, назначить встречу днём и устроить "
                    "неторопливую паузу вечером.</p>"
                    "<p>В основе меню — классические кофейные напитки, авторские рафы, "
                    "освежающие cold-позиции и выпечка, которую приятно брать к кофе. "
                    "Мы уделяем внимание деталям: от текстуры молока до подачи десертов, "
                    "чтобы каждое посещение ощущалось как маленький ритуал.</p>"
                    "<p>Нам важно, чтобы у гостя был выбор: остаться на разговор, "
                    "взять напиток с собой или оформить быстрый заказ онлайн. "
                    "Именно поэтому Coffich выглядит одинаково уютно и офлайн, и на сайте.</p>"
                ),
                "address": "Ташкент, ул. Шота Руставели, 12",
                "phone": "+998 20 005 50 85",
                "email": "sobrovv08@gmail.com",
                "hours": "Пн–Пт: 08:00 – 22:00\nСб–Вс: 09:00 – 23:00",
                "map_embed_url": "",
            },
        )

        self.stdout.write(self.style.SUCCESS("Демо-данные готовы."))
