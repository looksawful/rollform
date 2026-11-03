'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from './CartState';

const links = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/configure', label: 'Конструктор' },
  { href: '/#about', label: 'О проекте' },
];

function SiteChrome({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const pathname = usePathname();
  return <div className="site" id="top">
    <header className="topbar">
      <div className="wrapper topbar-inner cluster">
        <Link href="/" className="logo" aria-label="ROLLFORM — главная">ROLLFORM<span aria-hidden="true">◆</span></Link>
        <nav className="nav nav-desktop cluster" aria-label="Основное меню">
          {links.map(link => <Link key={link.href} aria-current={pathname === link.href ? 'page' : undefined} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link href="/cart" className="cart-trigger" aria-current={pathname === '/cart' ? 'page' : undefined}>Корзина <span>({count})</span></Link>
          <details className="mobile-navigation">
            <summary>Меню <span aria-hidden="true">☰</span></summary>
            <nav aria-label="Мобильное меню" className="mobile-nav-list">
              {links.map(link => <Link href={link.href} key={link.href} aria-current={pathname === link.href ? 'page' : undefined} onClick={event => {
                const details = event.currentTarget.closest('details');
                if (details) details.open = false;
              }}>{link.label}</Link>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer" id="contacts">
      <div className="wrapper cluster footer-inner"><Link className="logo" href="/">ROLLFORM</Link><span>Прототип для просмотра. Без заказов и оплаты.</span><a href="#top">Наверх ↑</a></div>
    </footer>
  </div>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  return <CartProvider><SiteChrome>{children}</SiteChrome></CartProvider>;
}
