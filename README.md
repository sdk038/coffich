# Coffich

Full-stack coffee shop app:
- `frontend/` - React (CRA)
- `django_backend/` - Django + DRF + JWT + SMS OTP login

## Deploy (Render)

This repo includes `render.yaml` for deploying both services:
- `coffich-backend` (Django API)
- `coffich-frontend` (static React build)

One-click Blueprint deploy:
- https://render.com/deploy?repo=https://github.com/sdk038/coffich

After creating services, set real SMS.to values in backend environment:
- `SMSTO_API_KEY`
- `SMSTO_SENDER_ID` (e.g. `SMSto`)
- `SMSTO_BASE_URL` (default `https://api.sms.to`)

Without valid SMS.to credentials, OTP SMS delivery will fail and API returns `503`.
