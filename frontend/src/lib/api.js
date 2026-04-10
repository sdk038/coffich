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
const AUTH_ACTIVITY_KEY = 'coffich-auth-activity';
const PUBLIC_CACHE_PREFIX = 'coffich-cache:';
const MAX_AUTH_IDLE_MS = 7 * 24 * 60 * 60 * 1000;
export const PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000;

const memoryCache = new Map();
let refreshRequestPromise = null;

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

function markAuthActivity() {
  try {
    localStorage.setItem(AUTH_ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function isAuthExpiredByInactivity() {
  try {
    const raw = localStorage.getItem(AUTH_ACTIVITY_KEY);
    if (!raw) return false;
    const lastActivityAt = Number(raw);
    if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) {
      return false;
    }
    return Date.now() - lastActivityAt > MAX_AUTH_IDLE_MS;
  } catch {
    return false;
  }
}

export function setTokens(access, refresh) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    markAuthActivity();
  } catch {
    /* ignore */
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(AUTH_ACTIVITY_KEY);
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

function cloneCachedPayload(data) {
  if (data == null) return data;
  return JSON.parse(JSON.stringify(data));
}

function buildUrl(path) {
  return `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
}

function getPublicCacheKey(url) {
  return `${PUBLIC_CACHE_PREFIX}${url}`;
}

function readPublicCache(url) {
  const key = getPublicCacheKey(url);
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cloneCachedPayload(cached.data);
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      memoryCache.delete(key);
      return null;
    }
    memoryCache.set(key, parsed);
    return cloneCachedPayload(parsed.data);
  } catch {
    return null;
  }
}

function writePublicCache(url, data, ttlMs) {
  const key = getPublicCacheKey(url);
  const payload = {
    expiresAt: Date.now() + ttlMs,
    data: cloneCachedPayload(data),
  };
  memoryCache.set(key, payload);
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

async function refreshAccessToken() {
  if (refreshRequestPromise) {
    return refreshRequestPromise;
  }
  const refresh = getRefreshToken();
  if (!refresh || isAuthExpiredByInactivity()) {
    clearTokens();
    return null;
  }

  refreshRequestPromise = (async () => {
    let res;
    try {
      res = await fetch(buildUrl('/api/auth/refresh/'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      clearTokens();
      return null;
    }

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    if (!data?.access) {
      clearTokens();
      return null;
    }

    setTokens(data.access, data.refresh || refresh);
    return data.access;
  })();

  try {
    return await refreshRequestPromise;
  } finally {
    refreshRequestPromise = null;
  }
}

export async function fetchAPI(path, options = {}) {
  const { skipAuth, _retry, ...rest } = options;
  const url = buildUrl(path);
  const shouldUseAuth = !skipAuth;
  if (shouldUseAuth && isAuthExpiredByInactivity()) {
    clearTokens();
  }

  let token = shouldUseAuth ? getAccessToken() : null;
  if (shouldUseAuth && !token && getRefreshToken()) {
    token = await refreshAccessToken();
  }

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
  if (res.status === 401 && shouldUseAuth && !_retry && getRefreshToken()) {
    const refreshedAccess = await refreshAccessToken();
    if (refreshedAccess) {
      return fetchAPI(path, { ...options, _retry: true });
    }
  }
  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(formatErrorFromBody(text, res.status), res.status);
  }
  if (shouldUseAuth && (token || getRefreshToken())) {
    markAuthActivity();
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

export async function cachedFetchAPI(path, options = {}) {
  const { ttlMs = PUBLIC_CACHE_TTL_MS, ...rest } = options;
  const method = String(rest.method || 'GET').toUpperCase();
  if (method !== 'GET' || rest.skipAuth !== true) {
    return fetchAPI(path, rest);
  }

  const url = buildUrl(path);
  const cached = readPublicCache(url);
  if (cached != null) {
    return cached;
  }

  const data = await fetchAPI(path, rest);
  writePublicCache(url, data, ttlMs);
  return cloneCachedPayload(data);
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
