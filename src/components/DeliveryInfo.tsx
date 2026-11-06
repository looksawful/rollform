'use client';

import { useState } from 'react';

export default function DeliveryInfo() {
  const [mapActive, setMapActive] = useState(false);
  return <section id="delivery" className="wrapper section production-info" aria-labelledby="delivery-title">
    <div className="production-copy stack">
      <div className="prose">
        <h2 id="delivery-title" className="section-title">Самовывоз и доставка</h2>
        <h3>Адрес самовывоза</h3>
        <p>Адрес самовывоза пока не подтверждён. Уточните его и время встречи при согласовании заказа.</p>
      </div>
      <div className="prose">
        <h3>Условия доставки</h3>
        <p>Доставляем по Москве и регионам. Заказы в наличии — в течение 3 дней, кубики под заказ — до 5 дней. Самовывоз бесплатный. Стоимость доставки и удобную дату получения согласуем при оформлении заказа.</p>
      </div>
    </div>
    <div className="production-map" onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMapActive(false);
    }}>
      <div className="production-map-frame" tabIndex={-1} data-active={mapActive ? 'true' : 'false'}
        onPointerLeave={() => setMapActive(false)}
        onKeyDown={event => { if (event.key === 'Escape') setMapActive(false); }}
        >
        <iframe title="Обзорная карта Москвы"
          src="https://www.openstreetmap.org/export/embed.html?bbox=37.3%2C55.5%2C37.9%2C55.9&layer=mapnik"
          loading="lazy" tabIndex={mapActive ? 0 : -1} referrerPolicy="strict-origin-when-cross-origin" />
        {!mapActive && <button type="button" className="production-map-activate"
          aria-label="Включить управление картой" onClick={event => {
            setMapActive(true);
            event.currentTarget.parentElement?.focus({ preventScroll: true });
          }}>
          <span>Управлять картой</span>
        </button>}
      </div>
      <div className="production-map-caption">
        <span>Обзорная карта · точка самовывоза не указана</span>
        <a href="https://www.openstreetmap.org/#map=10/55.7/37.6" target="_blank" rel="noopener noreferrer">Открыть карту</a>
        {mapActive && <button type="button" className="text-action" onClick={() => setMapActive(false)}>Выключить управление картой</button>}
      </div>
    </div>
  </section>;
}
