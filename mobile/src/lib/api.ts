import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './config';

const ACCESS_KEY = 'coffich-mobile-access';
const REFRESH_KEY = 'coffich-mobile-refresh';

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
