import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { cachedFetchAPI, normalizeOne, PUBLIC_CACHE_TTL_MS } from '../lib/api';
import { DEMO_SHOP, hasMeaningfulShopContent } from '../lib/demoContent';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [shop, setShop] = useState(DEMO_SHOP);
  const [loading, setLoading] = useState(false);
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
          const nextShop = normalizeOne(res);
          setShop(hasMeaningfulShopContent(nextShop) ? nextShop : DEMO_SHOP);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setShop((current) => (hasMeaningfulShopContent(current) ? current : DEMO_SHOP));
          setError(null);
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
