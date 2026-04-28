# Generated manually for Location model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("menu", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Location",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("city", models.CharField(max_length=120, verbose_name="Город")),
                ("slug", models.SlugField(max_length=140, unique=True)),
                ("address", models.CharField(max_length=500)),
                ("hours", models.TextField(blank=True, help_text="По умолчанию можно оставить пустым — подтянутся часы сети")),
                ("phone", models.CharField(blank=True, help_text="Опционально, для филиала; иначе на сайте — общий телефон", max_length=100)),
                ("map_embed_url", models.URLField(blank=True)),
                ("sort_order", models.IntegerField(default=0)),
                ("is_published", models.BooleanField(default=True, verbose_name="Показывать на сайте")),
            ],
            options={
                "verbose_name": "локация",
                "verbose_name_plural": "локации",
                "ordering": ["sort_order", "id"],
            },
        ),
    ]
