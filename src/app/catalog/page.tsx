import ProductGallery from '@/components/ProductGallery';

export default function CatalogPage() {
  return <section className="wrapper section page-section stack">
    <h1 className="page-title">Кубики в наличии</h1>
    <p>Готовые варианты доставляем по Москве и регионам в течение 3 дней. Самовывоз бесплатный.</p>
    <ProductGallery mode="grid" />
  </section>;
}
