export default function ProductionInfo({ onHome = false }: { onHome?: boolean }) {
  return <section id={onHome ? 'production' : undefined}
    className={`wrapper section production-info stack${onHome ? '' : ' page-section'}`}>
    {onHome ? <h2 className="section-title">Изготовление и получение</h2> : <h1 className="page-title">Изготовление и доставка</h1>}
    <div className="production-intro stack">
      {!onHome && <p className="eyebrow">Процесс и получение</p>}
      <p>У готовых кубиков и вариантов на заказ разные сроки подготовки.</p>
    </div>
    <div className="production-map">
      <iframe
        title="Интерактивная карта Москвы, временная метка: Кремль"
        src="https://www.openstreetmap.org/export/embed.html?bbox=37.6065%2C55.7465%2C37.6275%2C55.7585&layer=mapnik&marker=55.7520%2C37.6175"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div className="production-map-caption">
        <p>На карте временно указан Кремль. Это не адрес самовывоза.</p>
        <a href="https://www.openstreetmap.org/?mlat=55.7520&mlon=37.6175#map=16/55.7520/37.6175"
          target="_blank" rel="noopener noreferrer">Открыть карту</a>
      </div>
    </div>
  </section>;
}
