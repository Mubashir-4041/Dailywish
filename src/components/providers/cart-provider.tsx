'use client';
import * as React from 'react';
import type { CartLine } from '@/types';
import { siteConfig } from '@/config/site';

interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (line: Omit<CartLine, 'quantity'>, qty?: number) => void;
  updateQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  lineKey: (line: Pick<CartLine, 'productId' | 'variant'>) => string;
}

const CartContext = React.createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'dw_cart';

function keyOf(line: Pick<CartLine, 'productId' | 'variant'>) {
  return `${line.productId}::${line.variant?.sku ?? 'default'}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartLine[]>([]);
  const [isOpen, setOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem: CartContextValue['addItem'] = (line, qty = 1) => {
    setItems((prev) => {
      const key = keyOf(line);
      const existing = prev.find((i) => keyOf(i) === key);
      if (existing) {
        return prev.map((i) =>
          keyOf(i) === key
            ? { ...i, quantity: Math.min(i.maxStock || 99, i.quantity + qty) }
            : i,
        );
      }
      return [...prev, { ...line, quantity: qty }];
    });
    setOpen(true);
  };

  const updateQty: CartContextValue['updateQty'] = (key, qty) => {
    setItems((prev) =>
      prev
        .map((i) =>
          keyOf(i) === key
            ? { ...i, quantity: Math.max(1, Math.min(i.maxStock || 99, qty)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem: CartContextValue['removeItem'] = (key) =>
    setItems((prev) => prev.filter((i) => keyOf(i) !== key));

  const clear = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const shipping =
    subtotal === 0 || subtotal >= siteConfig.shipping.freeThreshold
      ? 0
      : siteConfig.shipping.flatRate;
  const total = subtotal + shipping;

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    shipping,
    total,
    isOpen,
    setOpen,
    addItem,
    updateQty,
    removeItem,
    clear,
    lineKey: keyOf,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
