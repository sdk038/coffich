# Coffich

Full-stack coffee shop app:
- `frontend/` - React (CRA)
- `django_backend/` - Django + DRF + JWT + Telegram/dev auth

## Deploy (Render)

This repo includes `render.yaml` for deploying both services:
- `coffich-backend` (Django API)
- `coffich-frontend` (static React build)

One-click Blueprint deploy:
- https://render.com/deploy?repo=https://github.com/sdk038/coffich

After creating services, set backend environment values:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_CHAT_ID`
- `DJANGO_CSRF_TRUSTED_ORIGINS` (your frontend URL, e.g. `https://coffich-frontend.onrender.com`)
- `BUKHARA_SERVICE_RADIUS_KM` (optional, default `45`)

Optional legacy SMS values if you still use SMS delivery outside the current auth flow:
- `SMSTO_API_KEY` (or `SMSTO_API_TOKEN`)
- `SMSTO_SENDER_ID` (e.g. `SMSto`)
- `SMSTO_BASE_URL` (default `https://api.sms.to`)

Frontend service env:
- `REACT_APP_API_URL` (your backend URL, e.g. `https://coffich-backend.onrender.com`)

If Telegram env vars are missing in deployment, login will report that Telegram auth is not configured.
