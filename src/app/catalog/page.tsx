import ProductGallery from '@/components/ProductGallery';

export default function CatalogPage() {
  return <section className="wrapper section page-section stack">
    <h1 className="page-title">Кубики в наличии</h1>
    <p>Готовые варианты можно забрать самостоятельно или получить курьерской доставкой в течение недели.</p>
    <ProductGallery mode="grid" />
  </section>;
}
