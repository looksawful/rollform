export default function ProductionInfo({ onHome = false }: { onHome?: boolean }) {
  return <section id={onHome ? 'production' : undefined}
    className={`wrapper section production-info stack${onHome ? '' : ' page-section'}`}>
    {onHome ? <h2 className="section-title">Изготовление и получение</h2> : <h1 className="page-title">Изготовление и доставка</h1>}
    <div className="production-intro stack">
      {!onHome && <p className="eyebrow">Процесс и получение</p>}
      <p>У готовых кубиков и вариантов на заказ разные сроки подготовки.</p>
    </div>
    <div className="production-visuals">
      <figure className="production-photo editorial-photo">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/process-example.webp`}
          alt="Работа с эпоксидной смолой"
          width={760} height={1000} loading="lazy" decoding="async" />
      </figure>
      <div className="production-map">
        <iframe
          title="Интерактивная карта Москвы, временная метка: Кремль"
          src="https://www.openstreetmap.org/export/embed.html?bbox=37.6065%2C55.7465%2C37.6275%2C55.7585&layer=mapnik&marker=55.7520%2C37.6175"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-popups"
        />
        <div className="production-map-caption">
          <p>На карте временно указан Кремль. Это не адрес самовывоза.</p>
          <a href="https://www.openstreetmap.org/?mlat=55.7520&mlon=37.6175#map=16/55.7520/37.6175"
            target="_blank" rel="noopener noreferrer">Открыть карту</a>
        </div>
      </div>
    </div>
    <div className="production-options stack">
      <section className="stack">
        <h2>Кубики в наличии</h2>
        <p>Готовые варианты можно забрать самостоятельно или получить курьерской доставкой в течение недели.</p>
      </section>
      <section className="stack">
        <h2>Кубики на заказ</h2>
        <p>Изготовление начинается после согласования формы, цвета и шрифта.</p>
        <p>Способ получения и дату согласуют перед оформлением заказа.</p>
      </section>
    </div>
  </section>;
}
