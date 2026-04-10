import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEV_FALLBACK_LOCATION } from '../lib/config';
import {
  ApiHttpError,
  clearStoredTokens,
  loadTokens,
  normalizeList,
  persistTokens,
  requestJson,
} from '../lib/api';
import { normalizeUser } from '../lib/normalize';

type AuthContextValue = {
  user: any | null;
  loading: boolean;
  sendCode: (payload: {
    phone: string;
    firstName: string;
    lastName: string;
  }) => Promise<any>;
  fetchTelegramStatus: (requestId: string) => Promise<any>;
  login: (phone: string, code: string) => Promise<void>;
  authorizedRequest: <T = any>(path: string, options?: any) => Promise<T>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getLocationPayload() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    if (__DEV__) {
      return DEV_FALLBACK_LOCATION;
    }
    throw new ApiHttpError(
      'Разрешите доступ к геолокации в настройках iPhone, чтобы проверить зону доставки и войти.',
      400
    );
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: Number(position.coords.latitude),
      longitude: Number(position.coords.longitude),
    };
  } catch {
    if (__DEV__) {
      return DEV_FALLBACK_LOCATION;
    }
    throw new ApiHttpError(
      'Не удалось определить геолокацию. Проверьте GPS и попробуйте ещё раз.',
      400
    );
  }
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [tokens, setTokens] = useState<{ access: string | null; refresh: string | null }>({
    access: null,
    refresh: null,
  });
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTokens = useCallback(async (preferredRefresh?: string | null) => {
    const refreshToken = preferredRefresh || tokens.refresh;
    if (!refreshToken) {
      return null;
    }
    const data = await requestJson<{ access: string; refresh?: string }>('/api/auth/refresh/', {
      method: 'POST',
      body: { refresh: refreshToken },
    });
    const nextTokens = {
      access: data.access,
      refresh: data.refresh || refreshToken,
    };
    setTokens(nextTokens);
    await persistTokens(nextTokens.access, nextTokens.refresh);
    return nextTokens.access;
  }, [tokens.refresh]);

  const loadMe = useCallback(
    async (preferredAccess?: string | null, preferredRefresh?: string | null) => {
      const access = preferredAccess || tokens.access;
      const refreshToken = preferredRefresh || tokens.refresh;
      if (!access) {
        setUser(null);
        return;
      }
      try {
        const me = await requestJson('/api/auth/me/', {
          token: access,
        });
        setUser(normalizeUser(me));
      } catch (error) {
        if (error instanceof ApiHttpError && error.status === 401 && refreshToken) {
          const refreshed = await refreshTokens(refreshToken);
          if (refreshed) {
            const me = await requestJson('/api/auth/me/', {
              token: refreshed,
            });
            setUser(normalizeUser(me));
            return;
          }
        }
        await clearStoredTokens();
        setTokens({ access: null, refresh: null });
        setUser(null);
      }
    },
    [refreshTokens, tokens.access, tokens.refresh]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadTokens();
        if (cancelled) return;
        setTokens(stored);
        if (stored.access) {
          await loadMe(stored.access, stored.refresh);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe]);

  const sendCode = useCallback(async ({ phone, firstName, lastName }: { phone: string; firstName: string; lastName: string }) => {
    const location = await getLocationPayload();
    return requestJson('/api/auth/send-code/', {
      method: 'POST',
      body: {
        phone,
        first_name: firstName,
        last_name: lastName,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });
  }, []);

  const login = useCallback(async (phone: string, code: string) => {
    const data = await requestJson<{ access: string; refresh: string }>('/api/auth/login/', {
      method: 'POST',
      body: { phone, code },
    });
    setTokens(data);
    await persistTokens(data.access, data.refresh);
    const me = await requestJson('/api/auth/me/', {
      token: data.access,
    });
    setUser(normalizeUser(me));
  }, []);

  const fetchTelegramStatus = useCallback(async (requestId: string) => {
    return requestJson(
      `/api/auth/telegram-status/?requestId=${encodeURIComponent(String(requestId || '').trim())}`
    );
  }, []);

  const authorizedRequest = useCallback(
    async <T,>(path: string, options: any = {}) => {
      const access = tokens.access || (await refreshTokens());
      if (!access) {
        throw new ApiHttpError('Нужна авторизация.', 401);
      }
      try {
        return await requestJson<T>(path, {
          ...options,
          token: access,
        });
      } catch (error) {
        if (error instanceof ApiHttpError && error.status === 401 && tokens.refresh) {
          const refreshed = await refreshTokens();
          if (!refreshed) {
            throw error;
          }
          return requestJson<T>(path, {
            ...options,
            token: refreshed,
          });
        }
        throw error;
      }
    },
    [refreshTokens, tokens.access, tokens.refresh]
  );

  const logout = useCallback(async () => {
    await clearStoredTokens();
    setTokens({ access: null, refresh: null });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      sendCode,
      fetchTelegramStatus,
      login,
      authorizedRequest,
      logout,
    }),
    [authorizedRequest, fetchTelegramStatus, loading, login, logout, sendCode, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
