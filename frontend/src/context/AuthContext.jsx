import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  clearTokens,
  fetchAPI,
  getAccessToken,
  setTokens,
} from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const data = await fetchAPI('/api/auth/me/');
    setUser(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadMe();
      } catch {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe]);

  const login = useCallback(async (phone, code) => {
    const data = await fetchAPI('/api/auth/login/', {
      method: 'POST',
      skipAuth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    setTokens(data.access, data.refresh);
    const me = await fetchAPI('/api/auth/me/');
    setUser(me);
  }, []);

  const sendCode = useCallback(async ({ phone, firstName, lastName, latitude, longitude }) => {
    return fetchAPI('/api/auth/send-code/', {
      method: 'POST',
      skipAuth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        first_name: firstName,
        last_name: lastName,
        latitude,
        longitude,
      }),
    });
  }, []);

  const fetchTelegramStatus = useCallback(async (requestId) => {
    return fetchAPI(`/api/auth/telegram-status/?requestId=${encodeURIComponent(requestId)}`, {
      skipAuth: true,
    });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      sendCode,
      fetchTelegramStatus,
      logout,
      refreshUser: loadMe,
    }),
    [user, loading, login, sendCode, fetchTelegramStatus, logout, loadMe]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
