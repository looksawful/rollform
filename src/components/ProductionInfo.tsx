'use client';

import { useState } from 'react';

export default function ProductionInfo({ onHome = false }: { onHome?: boolean }) {
  const [mapActive, setMapActive] = useState(false);
  return <section id={onHome ? 'production' : undefined}
    className={`wrapper section production-info${onHome ? '' : ' page-section'}`}>
    <div className="production-copy stack">
      {onHome ? <h2 className="section-title">Изготовление и получение</h2> : <h1 className="page-title">Изготовление и доставка</h1>}
      <div className="production-intro stack">
        {!onHome && <p className="eyebrow">Процесс и получение</p>}
        <p>У готовых кубиков и вариантов на заказ разные сроки подготовки.</p>
      </div>
    </div>
    <div className="production-map">
      <div className="production-map-frame" data-active={mapActive ? 'true' : 'false'}
        onPointerLeave={() => setMapActive(false)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMapActive(false);
        }}>
        <iframe
          title="Интерактивная карта Москвы"
          src="https://www.openstreetmap.org/export/embed.html?bbox=37.6065%2C55.7465%2C37.6275%2C55.7585&layer=mapnik&marker=55.7520%2C37.6175"
          loading="lazy"
          tabIndex={mapActive ? 0 : -1}
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {!mapActive && <button type="button" className="production-map-activate"
          aria-label="Включить управление картой" onClick={() => setMapActive(true)}>
          <span>Управлять картой</span>
        </button>}
      </div>
      <div className="production-map-caption">
        <a href="https://www.openstreetmap.org/?mlat=55.7520&mlon=37.6175#map=16/55.7520/37.6175"
          target="_blank" rel="noopener noreferrer">Открыть карту</a>
      </div>
    </div>
  </section>;
}
