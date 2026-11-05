'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from './CartState';
import { isDarkPath, themeHref } from '@/lib/themeRoutes';

const menuLinks = [
  { href: '/', label: 'Главная' },
  { href: '/catalog', label: 'Кубики' },
  { href: '/configure', label: 'Собери сам' },
  { href: '/#about', label: 'О нас' },
  { href: '/contacts', label: 'Контакты' },
];

function SiteChrome({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const reveal = () => { if (window.scrollY > 24) setRevealed(true); };
    window.addEventListener('scroll', reveal, { passive: true });
    reveal();
    return () => window.removeEventListener('scroll', reveal);
  }, []);
  const pathname = usePathname();
  const dark = isDarkPath(pathname);
  const path = pathname.replace(/\/$/, '');
  const link = (href: string) => themeHref(pathname, href);
  const navigation = menuLinks.map(({ href, label }) =>
    <Link key={href} href={link(href)} aria-current={path === link(href) ? 'page' : undefined}>{label}</Link>
  );
  return <div className="site" data-theme={dark ? 'dark' : 'light'}>
    <header className={revealed ? "topbar topbar-visible" : "topbar"}>
      <div className="wrapper topbar-inner cluster">
        <Link href={link("/")} className="logo logo-hidden" aria-label="На главную">Лого</Link>
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
          {count > 0 && <Link href={link("/cart")} className="cart-shortcut" aria-label={'Корзина, товаров: ' + count}
            aria-current={path === link('/cart') ? 'page' : undefined}>
            <ShoppingBag className="icon" aria-hidden="true" />
            <span className="cart-count" aria-hidden="true">{count}</span>
          </Link>}
        </div>
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer">
      <div className="wrapper footer-inner switcher">
        <nav className="stack" aria-label="Навигация в подвале">
          <h2>Навигация</h2>
          <Link href={link("/catalog")}>Каталог</Link>
          <Link href={link("/configure")}>Конструктор</Link>
          <Link href={link("/production")}>Изготовление и доставка</Link>
        </nav>
        <div className="stack">
          <h2>Контакты</h2>
          <Link href={link("/contacts")}>Связаться</Link>
          <a href="mailto:i@lookawful.ru">i@lookawful.ru</a>
        </div>
      </div>
    </footer>
  </div>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  return <CartProvider><SiteChrome>{children}</SiteChrome></CartProvider>;
}
