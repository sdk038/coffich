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
## App Store release prep
- `eas.json` is now the source of truth for `development`, `preview`, and `production` iOS build profiles.
- `app.json` now contains iOS build metadata (`bundleIdentifier`, `buildNumber`, location permission copy, encryption declaration).
- Production EAS builds are expected to use:
  `EXPO_PUBLIC_API_URL=https://coffich-backend.onrender.com`
- Local `.env` stays for development only and should never be committed.

## Apple account handoff
1. Join / activate Apple Developer Program.
2. Create the app in App Store Connect with bundle ID:
   `com.sdk038.coffich`
3. Log in with Expo:
   `npx eas login`
4. Initialize / link the Expo project:
   `npx eas init`
5. Build the first iOS binary:
   `npm run eas:build:ios:preview`
6. After smoke testing, build the production binary:
   `npm run eas:build:ios:production`
7. In App Store Connect, complete:
   - app description
   - screenshots
   - support URL
   - privacy answers
   - age rating
   - export compliance
8. Upload / submit the production build to App Store Connect.

## Store-facing assets
- Current icon and splash assets are wired in `app.json`.
- Before final App Store submission, replace them if you want stronger brand polish, but the project is already structurally ready for build and submission prep.
