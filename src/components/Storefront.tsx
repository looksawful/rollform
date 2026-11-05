'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { themeHref } from '@/lib/themeRoutes';
import DiceViewer from './DiceViewer';
import ProductCard from './ProductCard';
import ContactContent from './ContactContent';
import { initialConfig, presets } from '@/lib/catalog';

export default function Storefront() {
  const pathname = usePathname();
  return <>
    <section className="wrapper hero split" aria-labelledby="hero-title">
      <div className="hero-object"><DiceViewer config={initialConfig} continuous /></div>
      <div className="hero-copy stack">
        <h1 id="hero-title">Заголовок</h1>
        <p>Текст</p>
        <Link className="button button-black" href={themeHref(pathname, "/configure")}>Кнопка</Link>
      </div>
    </section>
    <section className="wrapper section stack" id="catalog">
      <h2 className="section-title">В наличии</h2>
      <div className="product-scroller reel" role="region" aria-label="В наличии" tabIndex={0}>{presets.map(p => <ProductCard key={p.id} product={p} />)}</div>
    </section>
    <section className="wrapper section prose" id="about">
      <h2 className="section-title">О нас</h2>
      <p>Внимание, этот текст является рыбой.</p>
    </section>
    <section className="wrapper section stack" id="contacts">
      <h2 className="section-title">Контакты</h2>
      <ContactContent />
    </section>
  </>;
}
