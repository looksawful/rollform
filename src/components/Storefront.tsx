'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { themeHref } from '@/lib/themeRoutes';
import DiceViewer from './DiceViewer';
import ProductCard from './ProductCard';
import { initialConfig, presets } from '@/lib/catalog';

export default function Storefront() {
  const pathname = usePathname();
  return <>
    <section className="wrapper hero split" aria-labelledby="hero-title">
      <div className="hero-object"><DiceViewer config={initialConfig} /></div>
      <div className="hero-copy stack">
        <h1 id="hero-title">Заголовок</h1>
        <p>Текст</p>
        <Link className="button button-black" href={themeHref(pathname, "/configure")}>Кнопка</Link>
      </div>
    </section>
    <section className="wrapper section bento-section" aria-labelledby="benefits-title">
      <h2 id="benefits-title" className="section-title">Заголовок</h2>
      <div className="bento-viewport scroller" role="region" aria-label="Преимущества" tabIndex={0}>
        <div className="bento-grid">
          {Array.from({ length: 5 }, (_, i) =>
            <article className="bento-card box" key={i}>
              <h3>Заголовок</h3>
              <p>Текст</p>
            </article>
          )}
        </div>
      </div>
    </section>
    <section className="wrapper section stack" id="catalog">
      <h2 className="section-title">Заголовок</h2>
      <div className="product-scroller reel" role="region" aria-label="Товары" tabIndex={0}>{presets.map(p => <ProductCard key={p.id} product={p} />)}</div>
      <Link className="button button-black section-button" href={themeHref(pathname, "/catalog")}>Кнопка</Link>
    </section>
    <section className="wrapper section prose" id="about">
      <h2 className="section-title">О проекте</h2>
      <p>Внимание, этот текст является рыбой.</p>
    </section>
    <section className="wrapper section stack" id="contacts">
      <h2 className="section-title">Контакты</h2>
      <p>Текст</p>
      <Link className="button button-black section-button" href={themeHref(pathname, "/contacts")}>Кнопка</Link>
    </section>
  </>;
}
