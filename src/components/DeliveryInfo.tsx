'use client';

import { useState } from 'react';

export default function DeliveryInfo() {
  const [mapActive, setMapActive] = useState(false);
  return <section id="delivery" className="wrapper section production-info" aria-labelledby="delivery-title">
    <div className="production-copy stack">
      <div className="prose">
        <h2 id="delivery-title" className="section-title">Самовывоз и доставка</h2>
        <h3>Адрес самовывоза</h3>
        <p>Пункт самовывоза по адресу: …, д. 12, …, 12:00–18:00.</p>
      </div>
      <div className="prose">
        <h3>Условия доставки</h3>
        <p>Доставляем по Москве и регионам. Заказы в наличии — в течение 3 дней, кубики под заказ — до 5 дней. Самовывоз бесплатный. Стоимость доставки и удобную дату получения согласуем при оформлении заказа.</p>
      </div>
    </div>
    <div className="production-map" onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMapActive(false);
    }}>
      <div className="production-map-frame" tabIndex={0} role="group"
        aria-label="Обзорная карта Москвы. Для управления нажмите Enter или коснитесь карты"
        data-active={mapActive ? 'true' : 'false'}
        onPointerMove={event => { if (event.pointerType === 'mouse' && Math.abs(event.movementX) + Math.abs(event.movementY) > 2) setMapActive(true); }}
        onClick={() => setMapActive(true)}
        onPointerLeave={() => setMapActive(false)}
        onKeyDown={event => {
          if (event.key === 'Escape') setMapActive(false);
          if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setMapActive(true);
          }
        }}
        >
        <iframe title="Обзорная карта Москвы"
          src="https://www.openstreetmap.org/export/embed.html?bbox=37.3%2C55.5%2C37.9%2C55.9&layer=mapnik"
          loading="lazy" tabIndex={mapActive ? 0 : -1} referrerPolicy="strict-origin-when-cross-origin" />
      </div>
      <div className="production-map-caption">
        <span>Пункт самовывоза по адресу: …, д. 12, …, 12:00–18:00.</span>
      </div>
    </div>
  </section>;
}
