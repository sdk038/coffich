# Coffich

Full-stack coffee shop app:
- `frontend/` - React (CRA)
- `django_backend/` - Django + DRF + JWT + SMS OTP login

## Deploy (Render)

This repo includes `render.yaml` for deploying both services:
- `coffich-backend` (Django API)
- `coffich-frontend` (static React build)

After creating services, set real Twilio values in backend environment:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Without valid Twilio credentials, OTP SMS delivery will fail and API returns `503`.
