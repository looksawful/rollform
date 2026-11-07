'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CART_KEY, addCartItem, changeQuantity, readCart } from '@/lib/orders';
import type { CartItem, CartOrigin } from '@/lib/orders';
import type { DiceConfig } from '@/lib/catalog';

type CartContextValue = {
  items: CartItem[];
  count: number;
  add: (config: DiceConfig, origin: CartOrigin, available?: number) => boolean;
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { setItems(readCart(localStorage.getItem(CART_KEY))); } catch { /* Browser storage is optional. */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* Do not block the prototype. */ }
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    add(config, origin, available) {
      const input = { config, origin, available };
      // React can run state updaters later; exceptions inside them cannot be caught here.
      if (origin.kind === 'in_stock') {
        try { addCartItem(items, input); } catch { return false; }
      }
      setItems(current => {
        try { return addCartItem(current, input); } catch { return current; }
      });
      return true;
    },
    change(id, delta) { setItems(current => changeQuantity(current, id, delta)); },
    clear() { setItems([]); },
    remove(id) { setItems(current => current.filter(item => item.id !== id)); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('Missing CartProvider');
  return value;
}
