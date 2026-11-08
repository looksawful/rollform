'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CART_KEY, addCartItem, changeQuantity, readCart } from '@/lib/orders';
import type { CartItem, CartOrigin } from '@/lib/orders';
import type { DiceConfig } from '@/lib/catalog';

type CartContextValue = {
  items: CartItem[];
  count: number;
  add: (config: DiceConfig, origin: CartOrigin, available?: number) => number | false;
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Immediate snapshot prevents batched add calls from validating against stale render state.
  const itemsRef = useRef<CartItem[]>([]);
  const commit = (next: CartItem[]) => { itemsRef.current = next; setItems(next); };
  useEffect(() => {
    try { commit(readCart(localStorage.getItem(CART_KEY))); } catch { /* Browser storage is optional. */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* Do not block the prototype. */ }
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    add(config, origin, available) {
      try {
        const current = itemsRef.current;
        const next = addCartItem(current, { config, origin, available });
        // Return the committed line quantity, even when several clicks share one React render.
        if (next === current) return false;
        const changed = next.find(line => !current.some(previous =>
          previous.id === line.id && previous.quantity === line.quantity));
        if (!changed) return false;
        commit(next);
        return changed.quantity;
      } catch {
        return false;
      }
    },
    change(id, delta) { commit(changeQuantity(itemsRef.current, id, delta)); },
    clear() { commit([]); },
    remove(id) { commit(itemsRef.current.filter(item => item.id !== id)); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('Missing CartProvider');
  return value;
}
