import ProductCard from '@/components/ProductCard';
import { presets } from '@/lib/catalog';
export default function CatalogPage() {
  return <section className="wrapper section page-section stack">
    <span className="kicker">КАТАЛОГ / ПРОТОТИП</span><h1 className="page-title">Каталог</h1>
    <p className="page-intro">Все варианты демонстрационные и доступны только для формирования черновика предзаказа. Готовых изделий в наличии не заявлено.</p>
    <div className="catalog-group-head cluster"><h2>Предзаказ</h2><span>{presets.length} вариантов</span></div>
    <div className="auto-grid product-grid">{presets.map((p, i) => <ProductCard key={p.id} product={p} index={i}/>)}</div>
    <div className="catalog-group-head cluster"><h2>В наличии</h2><span>Нет подтверждённых остатков</span></div>
    <p className="empty-state">Готовые изделия появятся здесь после подтверждения наличия.</p>
  </section>;
}
