'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { themeHref } from '@/lib/themeRoutes';
import DiceViewer from './DiceViewer';
import ProductGallery from './ProductGallery';
import ContactContent from './ContactContent';
import { initialConfig } from '@/lib/catalog';

export default function Storefront() {
  const pathname = usePathname();
  return <>
    <section className="wrapper hero hero-centered" aria-labelledby="hero-title">
      <div className="hero-object"><DiceViewer config={initialConfig} continuous /></div>
      <div className="hero-copy stack">
        <h1 id="hero-title">Заголовок</h1>
        <p>Внимание! Этот текст является рыбой!</p>
        <Link className="button button-black" href={themeHref(pathname, "/configure")}>Собрать кубик</Link>
      </div>
    </section>
    <section className="wrapper section stack" id="catalog">
      <div className="catalog-heading">
        <h2 className="section-title">В наличии</h2>
        <Link className="catalog-link" href={themeHref(pathname, '/catalog')}>Весь каталог <span aria-hidden="true">↗</span></Link>
      </div>
      <ProductGallery mode="reel" />
    </section>
    <section className="wrapper section about-section" id="about">
      <div className="editorial-grid">
        <div className="editorial-copy stack">
          <p className="eyebrow">О проекте</p>
          <h2 className="section-title">О нас</h2>
          <p>Внимание! Этот текст является рыбой!</p>
          <Link href={themeHref(pathname, '/production')} className="text-link">Изготовление и получение</Link>
        </div>
        <figure className="editorial-photo">
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/dice-02.webp`}
            alt="Игральные кубики"
            width={1000} height={680} loading="lazy" decoding="async" />
        </figure>
      </div>
      <div className="editorial-mini-grid">
        <figure className="editorial-photo">
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/process-workshop.webp`}
            alt="Работа с эпоксидной смолой" width={760} height={1000} loading="lazy" decoding="async" />
        </figure>
        <figure className="editorial-photo">
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/dice-07.webp`}
            alt="Игральные кубики крупным планом" width={1000} height={680} loading="lazy" decoding="async" />
        </figure>
      </div>
    </section>
    <section className="wrapper section stack" id="faq">
      <h2 className="section-title">Частые вопросы</h2>
      <div className="faq-list">
        {[
          'Как выбрать кубик?',
          'Какие формы доступны?',
          'Можно изменить цвет?',
          'Что с материалами?',
          'Можно заказать свой вариант?',
          'Как узнать стоимость?',
          'Когда будет готов заказ?',
          'Как получить кубики?',
          'Как связаться с вами?',
        ].map(question => <details key={question}>
          <summary>{question}</summary>
          <p>Внимание! Этот текст является рыбой!</p>
        </details>)}
      </div>
    </section>
    <section className="wrapper section stack" id="contacts">
      <h2 className="section-title">Контакты</h2>
      <ContactContent />
    </section>
  </>;
}
