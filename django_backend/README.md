# Coffich — Django REST API

Замена Strapi: категории, товары, слайды главной, настройки кофейни (Shop).

## Запуск

В разработке нужны **два терминала** (оба процесса должны работать одновременно):

1. Django: `python manage.py runserver` (или `runserver 8001`).
2. React: в каталоге `frontend` — `npm start`, в браузере — `http://localhost:3000`.

Если Django остановлен (`Ctrl+C`), на сайте будет ошибка прокси вроде «Error occurred while trying to proxy … /api/…», а `http://127.0.0.1:8001` в браузере даст `ERR_CONNECTION_REFUSED`.

Копируйте команды **по одной строке**. Не вставляйте текст с `#` в ту же строку, что и `pip` или `manage.py` (в Windows cmd `#` не считается комментарием и ломает команду).

```bash
cd django_backend
python3 -m venv venv
```

Активация venv:

- macOS / Linux: `source venv/bin/activate`
- Windows (cmd): `venv\Scripts\activate.bat`
- Windows (PowerShell): `venv\Scripts\Activate.ps1`

```bash
pip install -r requirements.txt
python manage.py migrate
```

Демо-данные (по желанию, отдельной строкой):

```bash
python manage.py seed_demo
```

Админка (по желанию):

```bash
python manage.py createsuperuser
```

Сервер (порт по умолчанию 8000):

```bash
python manage.py runserver
```

Если порт занят — другой порт (и обновите `REACT_APP_PROXY_TARGET` / прокси во фронте):

```bash
python manage.py runserver 8001
```

Или освободить 8000 (macOS / Linux):

```bash
lsof -ti:8000 | xargs kill
```

- Корень `http://127.0.0.1:8000/` — короткая подсказка со ссылками (не JSON).
- API: `http://127.0.0.1:8000/api/…` (товары, слайды, shop — см. таблицу ниже).
- Админка: `http://127.0.0.1:8000/admin/`
- Медиа (локально): `http://127.0.0.1:8000/media/...`

### Эндпоинты

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/api/products/` | Все товары |
| GET | `/api/products/?featured=true` | Только избранные |
| GET | `/api/hero-slides/` | Слайды (по `sort_order`) |
| GET | `/api/shop/` | Данные кофейни |

### Авторизация (JWT)

| Метод | Путь | Описание |
|--------|------|----------|
| POST | `/api/auth/register/` | Тело: `phone`, `firstName`, `lastName` — создаёт (или обновляет) пользователя и отправляет 4-значный код по SMS |
| POST | `/api/auth/login/` | Тело: `phone`, `code` (4 цифры) — ответ: `access`, `refresh` |
| POST | `/api/auth/send-code/` | Тело: `phone` — отправка нового 4-значного кода для входа |
| POST | `/api/auth/refresh/` | Обновление access-токена |
| GET | `/api/auth/me/` | Заголовок `Authorization: Bearer <access>` — профиль |

JSON в **camelCase** (совместимо с текущим React).

**SMS:** задайте в `.env` переменные `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (номер отправителя в Twilio).  
Если Twilio не настроен или отклоняет отправку, API вернёт `503` с точной причиной (`sms`) и код не будет считаться отправленным.

### Чтобы код приходил всем пользователям (production)

1. Переведите Twilio из Trial в Paid (в Trial SMS не всем номерам доставляются).
2. Убедитесь, что номер/сервис отправителя поддерживает страну получателя.
3. Для trial-аккаунта получатели должны быть в Verified Caller IDs.
4. Проверьте региональные ограничения и compliance (A2P/локальные требования, если применимо).
5. Настройте мониторинг ошибок доставки в логах backend.

## Фронтенд (CRA)

В корне `frontend`: прокси по умолчанию на `http://127.0.0.1:8000` (`setupProxy.js` — пути `/api` и `/media`).

Если Django запущен **на другом порту** (например `runserver 8001`), создайте `frontend/.env.development.local`:

```bash
REACT_APP_PROXY_TARGET=http://127.0.0.1:8001
```

И перезапустите `npm start`. Иначе запросы уйдут на :8000, где может быть другой процесс — страница будет «пустой», а в ошибке появится `Cannot GET /api/...`.

**Важно:** переменную нужно задать **в каталоге `frontend`** (файл выше), а не только экспортом в терминале, где крутится Django — Create React App читает env при старте `npm start` из `frontend/`. После правки `.env.development.local` обязательно остановите и снова запустите `npm start`.

Прямой URL API без прокси: `REACT_APP_API_URL=http://127.0.0.1:8000` и настройте CORS (`DJANGO_CORS_ORIGINS` при `DEBUG=0`).

## Продакшен

- `DEBUG=0`, `SECRET_KEY`, `ALLOWED_HOSTS`, `DJANGO_CORS_ORIGINS`
- Раздача статики/медиа через nginx или WhiteNoise; загрузки — в persistent volume
