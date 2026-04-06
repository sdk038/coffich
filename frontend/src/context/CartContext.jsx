import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { resolveProductImageUrl } from '../lib/coffeeImages';

const STORAGE_KEY = 'coffich-cart';

const CartContext = createContext(null);

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStored(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function lineKey(p) {
  return String(p.documentId ?? p.id ?? '');
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadStored());

  useEffect(() => {
    saveStored(items);
  }, [items]);

  const addItem = useCallback((product, qty = 1) => {
    const key = lineKey(product);
    if (!key) return;
    const imageUrl = resolveProductImageUrl(product) || '';
    const title = product.title || 'Товар';
    const price = Number(product.price) || 0;
    const categoryName = product.category?.name || '';

    setItems((prev) => {
      const i = prev.findIndex((x) => x.key === key);
      if (i >= 0) {
        const next = [...prev];
        next[i] = {
          ...next[i],
          quantity: next[i].quantity + qty,
        };
        return next;
      }
      return [
        ...prev,
        {
          key,
          documentId: product.documentId,
          id: product.id,
          title,
          price,
          quantity: qty,
          imageUrl,
          categoryName,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((key, quantity) => {
    const q = Math.max(0, Math.floor(Number(quantity) || 0));
    setItems((prev) => {
      if (q <= 0) return prev.filter((x) => x.key !== key);
      return prev.map((x) => (x.key === key ? { ...x, quantity: q } : x));
    });
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((x) => x.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCount = useMemo(
    () => items.reduce((s, x) => s + x.quantity, 0),
    [items]
  );

  const totalSum = useMemo(
    () => items.reduce((s, x) => s + x.price * x.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      setQuantity,
      removeItem,
      clear,
      totalCount,
      totalSum,
    }),
    [items, addItem, setQuantity, removeItem, clear, totalCount, totalSum]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
