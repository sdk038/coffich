import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeProduct } from '../lib/normalize';

const STORAGE_KEY = 'coffich-mobile-cart';

type CartItem = {
  key: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  categoryName?: string;
};

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  totalSum: number;
  addItem: (product: any, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(product: any) {
  return String(product.documentId ?? product.document_id ?? product.id ?? '');
}

export function CartProvider({ children }: React.PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items]);

  const addItem = useCallback((product: any, quantity = 1) => {
    const normalizedProduct = normalizeProduct(product);
    const key = lineKey(normalizedProduct);
    if (!key) return;

    setItems((current) => {
      const index = current.findIndex((item) => item.key === key);
      if (index >= 0) {
        const next = [...current];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + quantity,
        };
        return next;
      }

      return [
        ...current,
        {
          key,
          title: normalizedProduct.title || 'Товар',
          price: Number(normalizedProduct.price) || 0,
          quantity,
          imageUrl:
            normalizedProduct.image?.url || normalizedProduct.imageUrl || '',
          categoryName: normalizedProduct.category?.name || '',
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    const normalized = Math.max(0, Math.floor(quantity));
    setItems((current) => {
      if (normalized <= 0) {
        return current.filter((item) => item.key !== key);
      }
      return current.map((item) =>
        item.key === key ? { ...item, quantity: normalized } : item
      );
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const totalSum = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalCount,
      totalSum,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [addItem, clear, items, removeItem, setQuantity, totalCount, totalSum]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
}
