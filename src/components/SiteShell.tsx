'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from './CartState';

function SiteChrome({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const path = usePathname();
  return <div className="site">
    <header className="topbar">
      <div className="wrapper topbar-inner cluster">
        <Link href="/" className="logo" aria-label="ROLLFORM — главная">ROLLFORM</Link>
        <nav className="nav cluster" aria-label="Основное меню">
          <Link href="/configure" aria-current={path.endsWith('/configure') ? 'page' : undefined}>Конструктор</Link>
          <Link href="/cart" aria-current={path.endsWith('/cart') ? 'page' : undefined}>Корзина ({count})</Link>
        </nav>
      </div>
    </header>
    <main>{children}</main>
  </div>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  return <CartProvider><SiteChrome>{children}</SiteChrome></CartProvider>;
}
