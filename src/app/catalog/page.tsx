import ProductGallery from '@/components/ProductGallery';

export default function CatalogPage() {
  return <section className="wrapper section page-section stack">
    <h1 className="page-title">Кубики в наличии</h1>
    <p>Примеры сочетаний формы, цвета и шрифта. Изображения иллюстративные, фактическое наличие уточняется.</p>
    <ProductGallery mode="grid" />
  </section>;
}
