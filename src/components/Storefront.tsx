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
    <section className="wrapper hero split" aria-labelledby="hero-title">
      <div className="hero-object"><DiceViewer config={initialConfig} continuous /></div>
      <div className="hero-copy stack">
        <h1 id="hero-title">Игральные кости под ваш стиль</h1>
        <p>Выберите форму, цвет и шрифт. Посмотрите сочетание в 3D и соберите свой вариант.</p>
        <Link className="button button-black" href={themeHref(pathname, "/configure")}>Собрать кубик</Link>
      </div>
    </section>
    <section className="wrapper section stack" id="catalog">
      <h2 className="section-title">В наличии</h2>
      <p className="section-intro">Примеры сочетаний формы, цвета и шрифта. Изображения иллюстративные.</p>
      <ProductGallery mode="reel" />
    </section>
    <section className="wrapper section prose" id="about">
      <h2 className="section-title">О нас</h2>
      <p>Внимание, этот текст является рыбой.</p>
    </section>
    <section className="wrapper section stack" id="faq">
      <h2 className="section-title">Частые вопросы</h2>
      <div className="faq-list">
        <details>
          <summary>Можно ли изменить вариант из каталога?</summary>
          <p>Да. Откройте вариант в конструкторе и измените форму, цвет или шрифт.</p>
        </details>
        <details>
          <summary>Чем отличаются D4, D6 и другие формы?</summary>
          <p>Число после D обозначает количество граней. В конструкторе доступны D4, D6, D8, D10, D12, D20 и процентный D%.</p>
        </details>
        <details>
          <summary>Будет ли кубик точно таким, как на изображении?</summary>
          <p>Изображения и 3D-модели иллюстративные. Материал, оттенок и отделка реального изделия требуют подтверждения.</p>
        </details>
        <details>
          <summary>Когда изготовят кубик и как его получить?</summary>
          <p>Условия для готовых и заказных вариантов собраны на странице <Link href={themeHref(pathname, '/production')}>«Изготовление и доставка»</Link>.</p>
        </details>
      </div>
    </section>
    <section className="wrapper section stack" id="contacts">
      <h2 className="section-title">Контакты</h2>
      <ContactContent />
    </section>
  </>;
}
