import { Suspense } from 'react';
import Breadcrumbs, { catalogCrumb } from '@/components/Breadcrumbs';
import ProductDetail from '@/components/ProductDetail';
export default function ProductPage() {
  return <Suspense fallback={<div className="wrapper section page-section stack">
    <Breadcrumbs current="Кубик" ancestors={[catalogCrumb]} />
    <p>Загрузка варианта…</p>
  </div>}>
    <ProductDetail />
  </Suspense>;
}
