'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from './CartState';

function SiteChrome({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const path = usePathname().replace(/\/$/, '');
  return <div className="site">
    <header className="topbar">
      <div className="wrapper topbar-inner cluster">
        <Link href="/" className="logo" aria-label="логотип, на главную">логотип</Link>
        <nav className="nav cluster" aria-label="Основное меню">
          <Link href="/catalog" aria-current={path === '/catalog' ? 'page' : undefined}>Каталог</Link>
          <Link href="/configure" aria-current={path === '/configure' ? 'page' : undefined}>Конструктор</Link>
          <Link href="/#about">О проекте</Link>
          <Link href="/contacts" aria-current={path === '/contacts' ? 'page' : undefined}>Контакты</Link>
          <Link href="/cart" aria-current={path === '/cart' ? 'page' : undefined}>Корзина ({count})</Link>
        </nav>
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer">
      <div className="wrapper footer-inner">
        <div className="stack">
          <h2>Юридическая информация</h2>
          <p>Текст</p>
        </div>
        <div className="stack">
          <h2><Link href="/contacts">Контакты</Link></h2>
          <p>Текст</p>
        </div>
      </div>
    </footer>
  </div>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  return <CartProvider><SiteChrome>{children}</SiteChrome></CartProvider>;
}
