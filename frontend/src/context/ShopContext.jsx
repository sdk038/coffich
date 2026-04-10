import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { cachedFetchAPI, normalizeOne, PUBLIC_CACHE_TTL_MS } from '../lib/api';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const res = await cachedFetchAPI('/api/shop/', {
          skipAuth: true,
          ttlMs: PUBLIC_CACHE_TTL_MS,
        });
        if (!cancelled) {
          setShop(normalizeOne(res));
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setShop(null);
          setError(e?.message || 'Не удалось загрузить данные кофейни');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ shop, loading, error }),
    [shop, loading, error]
  );

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
