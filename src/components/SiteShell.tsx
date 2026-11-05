'use client';

import Link from 'next/link';
import { Menu, ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from './CartState';
import LegalDialogs from './LegalDialogs';
import { isDarkPath, themeHref } from '@/lib/themeRoutes';

const menuLinks = [
  { href: '/catalog', label: 'Кубики' },
  { href: '/configure', label: 'Собери сам' },
  { href: '/#about', label: 'О нас' },
  { href: '/contacts', label: 'Контакты' },
];

function SiteChrome({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const pathname = usePathname();
  const dark = isDarkPath(pathname);
  const path = pathname.replace(/\/$/, '');
  const link = (href: string) => themeHref(pathname, href);
  const navigation = menuLinks.map(({ href, label }) =>
    <Link key={href} href={link(href)} aria-current={path === link(href) ? 'page' : undefined}>{label}</Link>
  );
  return <div className="site" data-theme={dark ? 'dark' : 'light'}>
    <header className="topbar">
      <div className="wrapper topbar-inner cluster">
        <Link href={link("/")} className="logo" aria-label="На главную">Лого</Link>
        <nav className="nav cluster desktop-nav" aria-label="Основное меню">{navigation}</nav>
        <div className="header-actions cluster">
          <details className="mobile-menu" onKeyDown={e => {
            if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); }
          }}>
            <summary aria-label="Меню">
              <Menu className="icon" aria-hidden="true" />
            </summary>
            <nav className="mobile-nav stack" aria-label="Мобильное меню" onClick={e => {
              e.currentTarget.closest('details')?.removeAttribute('open');
            }}>{navigation}</nav>
          </details>
          <Link href={link("/cart")} className="cart-shortcut" aria-label={'Корзина, товаров: ' + count}
            aria-current={path === link('/cart') ? 'page' : undefined}>
            <ShoppingBag className="icon" aria-hidden="true" />
            <span className="cart-count" aria-hidden="true">{count}</span>
          </Link>
        </div>
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer">
      <div className="wrapper footer-inner switcher">
        <div className="stack">
          <h2>Юридическая информация</h2>
          <LegalDialogs />
        </div>
        <div className="stack">
          <h2><Link href={link("/contacts")}>Контакты</Link></h2>
          <Link href={link("/production")} className="footer-secondary-link">Сроки изготовления</Link>
        </div>
      </div>
    </footer>
  </div>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  return <CartProvider><SiteChrome>{children}</SiteChrome></CartProvider>;
}
