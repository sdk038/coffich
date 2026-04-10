# Mobile MVP Handoff

## What is already covered
- Expo app is wired for a physical iPhone in dev mode.
- `mobile/src/lib/config.ts` can use `EXPO_PUBLIC_API_URL` or derive a LAN host from Expo.
- Core flows exist: login, menu, cart, checkout, profile, order history.
- Main screens now have safer loading and retry states.

## Local iPhone demo checklist
1. Start Django on LAN:
   `python manage.py runserver 0.0.0.0:8000`
2. Put the Mac and iPhone on the same Wi-Fi.
3. Create `mobile/.env` from `mobile/.env.example`.
4. Set:
   `EXPO_PUBLIC_API_URL=http://YOUR_MAC_LAN_IP:8000`
5. Restart Expo after changing env vars.

## Backend env required for a real order flow
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_CHAT_ID`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`

Without Telegram env values:
- login can fail in production mode
- checkout still saves the order, but Telegram delivery can fall back to warning mode

## Current product constraints
- Delivery is restricted by backend geolocation rules for Bukhara.
- Login requires location permission to verify the delivery zone.
- Product and hero images still rely on fallback images until real assets are uploaded in backend/admin.

## Next step after MVP
- Finalize app assets: icon, splash, launch images
- Add `eas.json`
- Verify iOS bundle metadata in `app.json`
- Build first iOS test binary with EAS
- Prepare App Store Connect listing and privacy data
