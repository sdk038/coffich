import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './config';

const ACCESS_KEY = 'coffich-mobile-access';
const REFRESH_KEY = 'coffich-mobile-refresh';
const PUBLIC_CACHE_PREFIX = 'coffich-mobile-cache:';
const memoryCache = new Map<string, PublicCacheEntry<any>>();

export const PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000;
export const PUBLIC_STALE_TTL_MS = 24 * 60 * 60 * 1000;

type PublicCacheEntry<T> = {
  savedAt: number;
  expiresAt: number;
  data: T;
};

export class ApiHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

type CacheOptions = RequestOptions & {
  ttlMs?: number;
};

export async function requestJson<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, body, ...rest } = options;
  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiHttpError(
      __DEV__
        ? `Не удалось подключиться к серверу. Проверьте интернет и backend URL: ${API_BASE_URL}`
        : 'Не удалось подключиться к серверу. Проверьте интернет и повторите попытку.',
      0
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(formatErrorFromBody(text, res.status), res.status);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  return (await res.text()) as T;
}

function cloneCachedPayload<T>(data: T): T {
  if (data == null) return data;
  return JSON.parse(JSON.stringify(data)) as T;
}

function getPublicCacheKey(path: string) {
  return `${PUBLIC_CACHE_PREFIX}${API_BASE_URL}${path}`;
}

async function readPublicCacheEntry<T>(
  path: string
): Promise<PublicCacheEntry<T> | null> {
  const key = getPublicCacheKey(path);
  const fromMemory = memoryCache.get(key) as PublicCacheEntry<T> | undefined;
  if (fromMemory) {
    return fromMemory;
  }

  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicCacheEntry<T> | null;
    if (
      !parsed ||
      typeof parsed.savedAt !== 'number' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function writePublicCacheEntry<T>(
  path: string,
  data: T,
  ttlMs = PUBLIC_CACHE_TTL_MS
) {
  const key = getPublicCacheKey(path);
  const payload: PublicCacheEntry<T> = {
    savedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    data: cloneCachedPayload(data),
  };
  memoryCache.set(key, payload);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* ignore cache write errors */
  }
}

export async function readCachedJson<T = any>(
  path: string,
  maxAgeMs = PUBLIC_STALE_TTL_MS
): Promise<T | null> {
  const cached = await readPublicCacheEntry<T>(path);
  if (!cached) return null;
  if (Date.now() - cached.savedAt > maxAgeMs) {
    return null;
  }
  return cloneCachedPayload(cached.data);
}

export async function cachedRequestJson<T = any>(
  path: string,
  options: CacheOptions = {}
): Promise<T> {
  const { ttlMs = PUBLIC_CACHE_TTL_MS, method, ...rest } = options;
  const normalizedMethod = String(method || 'GET').toUpperCase();

  if (normalizedMethod !== 'GET' || rest.token) {
    return requestJson<T>(path, { ...rest, method });
  }

  const cached = await readPublicCacheEntry<T>(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cloneCachedPayload(cached.data);
  }

  const data = await requestJson<T>(path, { ...rest, method: normalizedMethod });
  await writePublicCacheEntry(path, data, ttlMs);
  return cloneCachedPayload(data);
}

export async function refreshCachedJson<T = any>(
  path: string,
  options: CacheOptions = {}
): Promise<T> {
  const { ttlMs = PUBLIC_CACHE_TTL_MS, ...rest } = options;
  const data = await requestJson<T>(path, rest);
  await writePublicCacheEntry(path, data, ttlMs);
  return cloneCachedPayload(data);
}

function formatErrorFromBody(text: string, status: number) {
  if (!text) return `HTTP ${status}`;
  try {
    const json = JSON.parse(text);
    if (typeof json.detail === 'string') return json.detail;
    for (const value of Object.values(json)) {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && value.length && typeof value[0] === 'string') {
        return value[0];
      }
    }
  } catch {
    /* ignore */
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('<!') || trimmed.includes('<html')) {
    return `Сервер вернул HTML вместо JSON (HTTP ${status}). Проверьте API URL.`;
  }

  return trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed;
}

export async function loadTokens() {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { access, refresh };
}

export async function persistTokens(access?: string | null, refresh?: string | null) {
  if (access) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
  }
  if (refresh) {
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  }
}

export async function clearStoredTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

export function normalizeList<T = any>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (res?.results && Array.isArray(res.results)) return res.results;
  const raw = res?.data;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}
