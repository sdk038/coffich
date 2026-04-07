from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from accounts.models import SmsCode
from accounts.sms import SmsDeliveryError, send_login_code_sms
from accounts.utils import normalize_phone


class Command(BaseCommand):
    help = "Отправляет тестовый 4-значный SMS код и сохраняет его для входа."

    def add_arguments(self, parser):
        parser.add_argument("--phone", required=True, help="Телефон, например +998901234567")
        parser.add_argument("--code", default="1234", help="Код для отправки (по умолчанию 1234)")

    def handle(self, *args, **options):
        phone_raw = options["phone"]
        code = str(options["code"]).strip() or "1234"
        if not code.isdigit() or len(code) != 4:
            raise CommandError("Параметр --code должен быть ровно 4 цифры.")

        try:
            phone = normalize_phone(phone_raw)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        try:
            user, created = User.objects.get_or_create(
                username=phone,
                defaults={"first_name": "Test", "last_name": "User"},
            )
            if created:
                user.set_unusable_password()
                user.save(update_fields=["password"])

            SmsCode.objects.filter(
                user=user,
                purpose=SmsCode.PURPOSE_AUTH,
                consumed_at__isnull=True,
            ).update(consumed_at=timezone.now())

            sms_row = SmsCode.objects.create(
                user=user,
                phone=phone,
                code=code,
                purpose=SmsCode.PURPOSE_AUTH,
                expires_at=timezone.now() + timedelta(minutes=5),
            )

            send_login_code_sms(phone, code)
        except SmsDeliveryError as exc:
            if "sms_row" in locals():
                sms_row.delete()
            raise CommandError(f"Отправка не удалась: {exc}") from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"SMS отправлен на {phone} с кодом {code}. Код сохранён для входа на 5 минут."
            )
        )
