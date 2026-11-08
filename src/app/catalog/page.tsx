import ProductGallery from '@/components/ProductGallery';
import Breadcrumbs, { catalogCrumb } from '@/components/Breadcrumbs';

export default function CatalogPage() {
  return <section className="wrapper section page-section stack">
    <Breadcrumbs current={catalogCrumb.label} />
    <h1 className="page-title">Кубики в наличии</h1>
    <p>Готовые варианты доставляем по Москве и регионам в течение 3 дней. Самовывоз бесплатный.</p>
    <ProductGallery mode="grid" />
  </section>;
}
