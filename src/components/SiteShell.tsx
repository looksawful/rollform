'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from './CartState';
import { isDarkPath, themeHref } from '@/lib/themeRoutes';

const menuLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/configure', label: 'Конструктор' },
  { href: '/#about', label: 'О проекте' },
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
        <Link href={link("/")} className="logo" aria-label="Логотип, на главную">Логотип</Link>
        <nav className="nav cluster desktop-nav" aria-label="Основное меню">{navigation}</nav>
        <div className="header-actions cluster">
          <details className="mobile-menu" onKeyDown={e => {
            if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); }
          }}>
            <summary aria-label="Меню">
              <span className="hamburger-lines" aria-hidden="true"><span/><span/><span/></span>
            </summary>
            <nav className="mobile-nav stack" aria-label="Мобильное меню" onClick={e => {
              e.currentTarget.closest('details')?.removeAttribute('open');
            }}>{navigation}</nav>
          </details>
          <Link href={link("/cart")} className="cart-shortcut" aria-label={'Корзина (' + count + ')'}
            aria-current={path === link('/cart') ? 'page' : undefined}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h16l-1 12H5L4 8Z"/>
              <path d="M9 9V6a3 3 0 0 1 6 0v3"/>
            </svg>
            <span className="cart-shortcut-label">Корзина</span>
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
          <p>Текст</p>
        </div>
        <div className="stack">
          <h2><Link href={link("/contacts")}>Контакты</Link></h2>
          <p>Текст</p>
        </div>
      </div>
    </footer>
  </div>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  return <CartProvider><SiteChrome>{children}</SiteChrome></CartProvider>;
}
