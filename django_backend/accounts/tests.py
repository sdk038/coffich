from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import SmsCode


@override_settings(SMS_PROVIDER="mock")
class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_send_code_creates_user_with_camel_case_names(self):
        response = self.client.post(
            "/api/auth/send-code/",
            {
                "phone": "+998 90 123 45 67",
                "firstName": "Daler",
                "lastName": "Sabirov",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("devCode", response.data)
        self.assertFalse(response.data["existingUser"])

        user = User.objects.get(username="+998901234567")
        self.assertEqual(user.first_name, "Daler")
        self.assertEqual(user.last_name, "Sabirov")
        self.assertTrue(
            SmsCode.objects.filter(user=user, phone="+998901234567").exists()
        )

    def test_send_code_updates_existing_user_and_login_returns_tokens(self):
        user = User.objects.create_user(
            username="+998901234568",
            password="unused-password",
            first_name="Old",
            last_name="Name",
        )

        send_response = self.client.post(
            "/api/auth/send-code/",
            {
                "phone": "+998901234568",
                "first_name": "New",
                "last_name": "Person",
            },
            format="json",
        )

        self.assertEqual(send_response.status_code, 200)
        self.assertTrue(send_response.data["existingUser"])

        user.refresh_from_db()
        self.assertEqual(user.first_name, "New")
        self.assertEqual(user.last_name, "Person")

        login_response = self.client.post(
            "/api/auth/login/",
            {
                "phone": "+998901234568",
                "code": send_response.data["devCode"],
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
