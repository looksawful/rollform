import ProductCard from '@/components/ProductCard';
import { presets } from '@/lib/catalog';

export default function CatalogPage() {
  return <section className="wrapper section page-section stack">
    <h1 className="page-title">Заголовок</h1>
    <p>Текст</p>
    <div className="product-grid grid">{presets.map(p => <ProductCard key={p.id} product={p} />)}</div>
  </section>;
}
