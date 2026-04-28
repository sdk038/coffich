import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { cachedFetchAPI, normalizeList, normalizeOne, PUBLIC_CACHE_TTL_MS } from '../lib/api';
import {
  DEMO_LOCATIONS,
  DEMO_SHOP,
  hasMeaningfulShopContent,
  mapLocationFromApi,
} from '../lib/demoContent';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [shop, setShop] = useState(DEMO_SHOP);
  const [locations, setLocations] = useState(DEMO_LOCATIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        try {
          const shopRes = await cachedFetchAPI('/api/shop/', {
            skipAuth: true,
            ttlMs: PUBLIC_CACHE_TTL_MS,
          });
          const nextShop = normalizeOne(shopRes);
          if (!cancelled) {
            setShop(hasMeaningfulShopContent(nextShop) ? nextShop : DEMO_SHOP);
          }
        } catch {
          if (!cancelled) {
            setShop((c) => (hasMeaningfulShopContent(c) ? c : DEMO_SHOP));
          }
        }

        try {
          const locRes = await cachedFetchAPI('/api/locations/', {
            skipAuth: true,
            ttlMs: PUBLIC_CACHE_TTL_MS,
          });
          const rawList = Array.isArray(locRes) ? locRes : normalizeList(locRes);
          const mapped = rawList
            .map(mapLocationFromApi)
            .filter(Boolean)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          if (!cancelled) {
            setLocations(mapped.length ? mapped : DEMO_LOCATIONS);
          }
        } catch {
          if (!cancelled) {
            setLocations(DEMO_LOCATIONS);
          }
        }

        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setShop((current) => (hasMeaningfulShopContent(current) ? current : DEMO_SHOP));
          setLocations(DEMO_LOCATIONS);
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
    () => ({ shop, locations, loading, error }),
    [shop, locations, loading, error]
  );

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
