/**
 * Базовый URL Django API.
 * В development без REACT_APP_API_URL запросы идут на тот же origin (localhost:3000)
 * и проксируются на Django — см. src/setupProxy.js.
 */
function getApiBase() {
  const env = process.env.REACT_APP_API_URL;
  if (env && String(env).trim() !== '') {
    return String(env).replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  return '';
}

export function apiBase() {
  return getApiBase();
}

const ACCESS_KEY = 'coffich-access';
const REFRESH_KEY = 'coffich-refresh';

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function setTokens(access, refresh) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch {
    /* ignore */
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiHttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

function formatErrorFromBody(text, status) {
  if (!text) return `HTTP ${status}`;
  try {
    const j = JSON.parse(text);
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
        .join('; ');
    }
    for (const v of Object.values(j)) {
      if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
      if (typeof v === 'string') return v;
    }
  } catch {
    /* not JSON */
  }
  return formatHttpErrorBody(text, status);
}

export async function fetchAPI(path, options = {}) {
  const { skipAuth, ...rest } = options;
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const token = skipAuth ? null : getAccessToken();
  let res;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });
  } catch {
    throw new ApiHttpError(
      'Нет связи с сервером. Запустите API: cd django_backend && source venv/bin/activate && python manage.py runserver',
      0
    );
  }
  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(formatErrorFromBody(text, res.status), res.status);
  }
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) {
    return res.json();
  }
  const bodyText = await res.text();
  if (bodyText.trim().startsWith('<!') || bodyText.includes('<html')) {
    throw new ApiHttpError(
      formatHttpErrorBody(bodyText, res.status),
      res.status
    );
  }
  return bodyText;
}

/** Не показывать пользователю целую HTML-страницу (Express 404, nginx и т.д.). */
function formatHttpErrorBody(text, status) {
  if (!text) return `HTTP ${status}`;
  const t = text.trim();
  if (t.startsWith('<!') || t.includes('<html')) {
    const pre = t.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    const inner = pre ? pre[1].replace(/<[^>]+>/g, '').trim() : '';
    if (inner.includes('Cannot GET') || inner.includes('Cannot POST')) {
      return (
        `API недоступен по этому адресу (${inner.slice(0, 120)}). ` +
        'Запустите Django (`python manage.py runserver`) и проверьте порт: ' +
        'по умолчанию фронт проксирует на :8000. Если Django на другом порту — ' +
        'создайте во frontend файл `.env.development.local` с ' +
        '`REACT_APP_PROXY_TARGET=http://127.0.0.1:ВАШ_ПОРТ` и перезапустите `npm start`.'
      );
    }
    return `Сервер вернул HTML вместо JSON (HTTP ${status}). Убедитесь, что запущен Django API, а не другой сервис на том же порту.`;
  }
  return t.length > 500 ? `${t.slice(0, 500)}…` : t;
}

/** Список: массив или обёртка DRF / legacy Strapi. */
export function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (res?.results && Array.isArray(res.results)) return res.results;
  const raw = res?.data;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map((entry) => {
      if (!entry) return null;
      const row =
        entry.attributes && typeof entry.attributes === 'object'
          ? { id: entry.id, documentId: entry.documentId, ...entry.attributes }
          : entry;
      if (row?.category?.data != null) {
        const c = row.category.data;
        row.category = Array.isArray(c)
          ? c.map(unwrapAttrs)
          : unwrapAttrs(c);
      }
      return row;
    })
    .filter(Boolean);
}

function unwrapAttrs(entry) {
  if (!entry) return null;
  if (entry.attributes && typeof entry.attributes === 'object') {
    return { id: entry.id, documentId: entry.documentId, ...entry.attributes };
  }
  return entry;
}

/** Один объект (Shop и т.п.). */
export function normalizeOne(res) {
  if (res == null) return null;
  if (typeof res === 'object' && !Array.isArray(res) && res.data === undefined) {
    return res;
  }
  const raw = res?.data;
  if (raw == null) return null;
  const row = unwrapAttrs(Array.isArray(raw) ? raw[0] : raw);
  if (row?.coverImage?.data != null) {
    row.coverImage = unwrapAttrs(row.coverImage.data);
  }
  return row;
}

/**
 * Картинка из API: `{ url }` или legacy Strapi nested `data`.
 */
export function mediaUrl(media) {
  if (!media) return null;
  let m = media;
  if (media.data != null) {
    const d = media.data;
    m = Array.isArray(d) ? unwrapAttrs(d[0]) : unwrapAttrs(d);
  }
  const url = m?.url || m?.formats?.large?.url || m?.formats?.medium?.url;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = getApiBase().replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}
