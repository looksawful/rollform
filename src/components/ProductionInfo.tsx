export default function ProductionInfo() {
  return <section className="wrapper section page-section prose production-info">
    <h1 className="page-title">Изготовление и доставка</h1>
    <p>У готовых кубиков и вариантов на заказ разные сроки подготовки.</p>
    <div className="production-options stack">
      <section className="stack">
        <h2>Кубики в наличии</h2>
        <p>Готовые варианты можно забрать самостоятельно или получить курьерской доставкой в течение недели.</p>
        <p>Фактическое наличие, адрес самовывоза и окончательные условия получения уточняются.</p>
      </section>
      <section className="stack">
        <h2>Кубики на заказ</h2>
        <p>Изготовление начинается после согласования формы, цвета и шрифта. Точный срок уточняется.</p>
        <p>Способ получения и дату согласуют перед оформлением заказа.</p>
      </section>
    </div>
  </section>;
}
