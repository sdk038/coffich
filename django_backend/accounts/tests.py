from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import CustomerProfile, SmsCode, TelegramBinding, TelegramLoginRequest


@override_settings(
    TELEGRAM_BOT_TOKEN="test-token",
    TELEGRAM_BOT_USERNAME="coffich_test_bot",
)
class TelegramAuthFlowTests(TestCase):
    bukhara_lat = 39.7747
    bukhara_lng = 64.4286
    outside_lat = 41.3111
    outside_lng = 69.2797

    def setUp(self):
        self.client = APIClient()

    @patch(
        "accounts.views.build_telegram_start_url",
        return_value="https://t.me/coffich_test_bot?start=test-start",
    )
    def test_send_code_creates_pending_telegram_login(self, _mock_start_url):
        response = self.client.post(
            "/api/auth/send-code/",
            {
                "phone": "+998 90 123 45 67",
                "firstName": "Daler",
                "lastName": "Sabirov",
                "latitude": self.bukhara_lat,
                "longitude": self.bukhara_lng,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["existingUser"])
        self.assertFalse(response.data["telegramLinked"])
        self.assertFalse(response.data["codeSent"])
        self.assertEqual(
            response.data["telegramBotUrl"],
            "https://t.me/coffich_test_bot?start=test-start",
        )
        self.assertIn("requestId", response.data)

        user = User.objects.get(username="+998901234567")
        self.assertEqual(user.first_name, "Daler")
        self.assertEqual(user.last_name, "Sabirov")
        self.assertEqual(user.customer_profile.latitude, self.bukhara_lat)
        self.assertEqual(user.customer_profile.longitude, self.bukhara_lng)
        self.assertTrue(
            TelegramLoginRequest.objects.filter(
                user=user, public_id=response.data["requestId"]
            ).exists()
        )

    @patch("accounts.views.send_auth_code_to_telegram")
    @patch(
        "accounts.views.find_start_update",
        return_value={
            "chat_id": "778899",
            "username": "daler_sab",
            "first_name": "Daler",
            "last_name": "Sabirov",
        },
    )
    @patch(
        "accounts.views.build_telegram_start_url",
        return_value="https://t.me/coffich_test_bot?start=test-start",
    )
    def test_status_links_telegram_sends_code_and_allows_login(
        self,
        _mock_start_url,
        _mock_find_start,
        mock_send_code,
    ):
        send_response = self.client.post(
            "/api/auth/send-code/",
            {
                "phone": "+998901234568",
                "first_name": "New",
                "last_name": "Person",
                "latitude": self.bukhara_lat,
                "longitude": self.bukhara_lng,
            },
            format="json",
        )

        self.assertEqual(send_response.status_code, 200)

        status_response = self.client.get(
            "/api/auth/telegram-status/",
            {
                "requestId": send_response.data["requestId"],
            },
        )

        self.assertEqual(status_response.status_code, 200)
        self.assertTrue(status_response.data["telegramLinked"])
        self.assertTrue(status_response.data["codeSent"])
        mock_send_code.assert_called_once()

        user = User.objects.get(username="+998901234568")
        user.refresh_from_db()
        self.assertEqual(user.first_name, "New")
        self.assertEqual(user.last_name, "Person")
        self.assertEqual(user.telegram_binding.chat_id, "778899")
        self.assertEqual(user.telegram_binding.username, "daler_sab")

        sms_code = SmsCode.objects.get(user=user, purpose=SmsCode.PURPOSE_AUTH)
        self.assertEqual(sms_code.phone, "+998901234568")

        login_response = self.client.post(
            "/api/auth/login/",
            {
                "phone": "+998901234568",
                "code": sms_code.code,
            },
            format="json",
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        me_response = self.client.get("/api/auth/me/")

        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["phone"], user.username)
        self.assertEqual(me_response.data["first_name"], "New")
        self.assertEqual(me_response.data["last_name"], "Person")
        self.assertEqual(me_response.data["latitude"], self.bukhara_lat)
        self.assertEqual(me_response.data["longitude"], self.bukhara_lng)

    @patch(
        "accounts.views.build_telegram_start_url",
        return_value="https://t.me/coffich_test_bot?start=fresh-start",
    )
    def test_send_code_requires_fresh_start_even_with_existing_binding(
        self, _mock_start_url
    ):
        user = User.objects.create_user(
            username="+998901234569",
            password="unused-password",
            first_name="Old",
            last_name="Name",
        )
        TelegramBinding.objects.create(
            user=user,
            chat_id="445566",
            username="bound_user",
        )

        response = self.client.post(
            "/api/auth/send-code/",
            {
                "phone": "+998901234569",
                "first_name": "Updated",
                "last_name": "User",
                "latitude": self.bukhara_lat,
                "longitude": self.bukhara_lng,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["existingUser"])
        self.assertFalse(response.data["telegramLinked"])
        self.assertFalse(response.data["codeSent"])
        self.assertEqual(
            response.data["telegramBotUrl"],
            "https://t.me/coffich_test_bot?start=fresh-start",
        )

        user.refresh_from_db()
        self.assertEqual(user.first_name, "Updated")
        self.assertEqual(user.last_name, "User")
        self.assertEqual(user.customer_profile.latitude, self.bukhara_lat)
        self.assertEqual(user.customer_profile.longitude, self.bukhara_lng)
        self.assertEqual(user.telegram_binding.chat_id, "445566")

    @patch("accounts.views.send_auth_code_to_telegram")
    @patch(
        "accounts.views.find_start_update",
        return_value={
            "chat_id": "999888777",
            "username": "fresh_user",
            "first_name": "Fresh",
            "last_name": "User",
        },
    )
    def test_status_replaces_old_binding_with_current_start(
        self, _mock_find_start, mock_send_code
    ):
        user = User.objects.create_user(
            username="+998901234573",
            password="unused-password",
            first_name="Old",
            last_name="Binding",
        )
        TelegramBinding.objects.create(
            user=user,
            chat_id="111222333",
            username="old_binding",
        )
        CustomerProfile.objects.create(
            user=user,
            latitude=self.bukhara_lat,
            longitude=self.bukhara_lng,
        )

        send_response = self.client.post(
            "/api/auth/send-code/",
            {
                "phone": "+998901234573",
                "first_name": "Updated",
                "last_name": "Binding",
                "latitude": self.bukhara_lat,
                "longitude": self.bukhara_lng,
            },
            format="json",
        )

        self.assertEqual(send_response.status_code, 200)
        self.assertFalse(send_response.data["telegramLinked"])
        self.assertFalse(send_response.data["codeSent"])

        status_response = self.client.get(
            "/api/auth/telegram-status/",
            {
                "requestId": send_response.data["requestId"],
            },
        )

        self.assertEqual(status_response.status_code, 200)
        self.assertTrue(status_response.data["telegramLinked"])
        self.assertTrue(status_response.data["codeSent"])
        mock_send_code.assert_called_once()

        user.refresh_from_db()
        self.assertEqual(user.telegram_binding.chat_id, "999888777")
        self.assertEqual(user.telegram_binding.username, "fresh_user")

    def test_send_code_rejects_user_outside_bukhara(self):
        response = self.client.post(
            "/api/auth/send-code/",
            {
                "phone": "+998901234570",
                "first_name": "Far",
                "last_name": "Away",
                "latitude": self.outside_lat,
                "longitude": self.outside_lng,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("location", response.data)
        self.assertFalse(User.objects.filter(username="+998901234570").exists())

    @patch("accounts.views.send_order_to_telegram")
    def test_checkout_passes_saved_location_to_telegram(self, mock_send_order):
        user = User.objects.create_user(
            username="+998901234571",
            password="unused-password",
            first_name="Geo",
            last_name="Buyer",
        )
        CustomerProfile.objects.create(
            user=user,
            latitude=self.bukhara_lat,
            longitude=self.bukhara_lng,
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            "/api/orders/checkout/",
            {
                "items": [
                    {
                        "key": "espresso",
                        "title": "Espresso",
                        "price": 18000,
                        "quantity": 2,
                    }
                ],
                "note": "Быстрая доставка",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        mock_send_order.assert_called_once()
        kwargs = mock_send_order.call_args.kwargs
        self.assertEqual(kwargs["latitude"], self.bukhara_lat)
        self.assertEqual(kwargs["longitude"], self.bukhara_lng)

    @patch("accounts.views.send_order_to_telegram")
    def test_checkout_rejects_user_outside_bukhara(self, mock_send_order):
        user = User.objects.create_user(
            username="+998901234572",
            password="unused-password",
            first_name="Outside",
            last_name="Buyer",
        )
        CustomerProfile.objects.create(
            user=user,
            latitude=self.outside_lat,
            longitude=self.outside_lng,
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            "/api/orders/checkout/",
            {
                "items": [
                    {
                        "key": "latte",
                        "title": "Latte",
                        "price": 25000,
                        "quantity": 1,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("location", response.data)
        mock_send_order.assert_not_called()
