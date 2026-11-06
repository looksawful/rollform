'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from './CartState';
import { themeHref } from '@/lib/themeRoutes';

const menuLinks = [
  { href: '/', label: 'Главная' },
  { href: '/catalog', label: 'Кубики' },
  { href: '/configure', label: 'Собери сам' },
  { href: '/#about', label: 'О нас' },
  { href: '/contacts', label: 'Контакты' },
];

function SiteChrome({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const mainRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const reveal = () => {
      if (window.scrollY > 24) {
        setRevealed(true);
        window.removeEventListener('scroll', reveal);
      }
    };
    window.addEventListener('scroll', reveal, { passive: true });
    reveal();
    return () => window.removeEventListener('scroll', reveal);
  }, []);
  const pathname = usePathname();
  useEffect(() => {
    const main = mainRef.current;
    if (!main || !('IntersectionObserver' in window)) return;

    let cancelled = false;
    let media: { revert: () => void } | undefined;
    const seen = new WeakSet<Element>();
    void import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      const mm = gsap.matchMedia();
      media = mm;
      mm.add('(prefers-reduced-motion: no-preference)', context => {
        const candidates = Array.from(main.querySelectorAll<HTMLElement>(
          '.section-title, .page-heading, .catalog-heading, .catalog-footer, .editorial-copy, .editorial-photo, .production-intro, .order-step, .bento-card, .faq-list > details, .contact-method, .contact-form, .production-copy > .prose, .production-map',
        )).filter(element => !element.closest('.hero, .product-scroller, .product'));
        // Reveal a copy group once, without also animating its nested heading.
        const targets = candidates.filter(element => !candidates.some(parent => parent !== element && parent.contains(element)));
        const observer = new IntersectionObserver(entries => {
          let index = 0;
          for (const { target, isIntersecting } of entries) {
            if (!isIntersecting || seen.has(target)) continue;
            seen.add(target);
            observer.unobserve(target);
            context.add(() => {
              const isMedia = target.matches('.editorial-photo');
              gsap.fromTo(target, { opacity: 0, y: 20, scale: isMedia ? 0.98 : 1 }, {
                opacity: 1, y: 0, scale: 1, duration: 0.8, delay: Math.min(index++ * 0.07, 0.21),
                ease: 'power3.out', clearProps: 'opacity,transform',
              });
            });
          }
        }, { rootMargin: '0px 0px -6% 0px' });
        for (const target of targets) {
          // Keep SSR, restored scroll positions and the initial viewport visible.
          // Offscreen content stays visible too until its observer callback runs.
          if (target.getBoundingClientRect().top < window.innerHeight) seen.add(target);
          if (!seen.has(target)) observer.observe(target);
        }
        return () => observer.disconnect();
      });
    }).catch(() => { /* Motion is optional; content is already visible. */ });
    return () => {
      cancelled = true;
      media?.revert();
    };
  }, [pathname]);
  const path = pathname.replace(/\/$/, '');
  const link = (href: string) => themeHref(pathname, href);
  const navigation = menuLinks.map(({ href, label }) =>
    <Link key={href} href={link(href)} aria-current={path === link(href) ? 'page' : undefined}>{label}</Link>
  );
  return <div className="site" data-theme="light">
    <header className={revealed ? "topbar topbar-visible" : "topbar"}>
      <div className="wrapper topbar-inner cluster">
        <Link href={link("/")} className="logo" aria-label="На главную">
          <img className="logo-mark" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/brand/rollform-logo.svg`} width={45} height={48} alt="" />
          <span className="logo-word">Логотип</span>
        </Link>
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
            <span className="cart-shortcut-label">Корзина</span>
            {count > 0 && <span className="cart-count" aria-hidden="true">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
    <main ref={mainRef}>{children}</main>
    <footer className="footer">
      <div className="wrapper footer-inner switcher">
        <nav className="stack" aria-label="Навигация в подвале">
          <h2>Навигация</h2>
          <Link href={link("/catalog")}>Каталог</Link>
          <Link href={link("/configure")}>Конструктор</Link>
          <Link href={link("/#about")}>О нас</Link>
          <Link href={link("/production")}>Изготовление и доставка</Link>
        </nav>
        <div className="stack">
          <h2>Контакты</h2>
          <Link href={link("/contacts")}>Связаться</Link>
          <span>hello@kubiki.example</span>
          <span>+7 (000) 000-00-00</span>
        </div>
      </div>
      <div className="wrapper footer-details prose">
        <h2>Реквизиты</h2>
        <p>ИП Иванов Иван Иванович — временный образец имени продавца.</p>
        <p>ИНН, ОГРНИП, адрес регистрации и банковские реквизиты: не указаны, ожидают подтверждения.</p>
        <p>Демонстрационный прототип. Данные продавца и контакты временные; заявки и оплата не принимаются.</p>
      </div>
    </footer>
  </div>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  return <CartProvider><SiteChrome>{children}</SiteChrome></CartProvider>;
}
