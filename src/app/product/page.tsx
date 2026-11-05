import { Suspense } from 'react';
import ProductDetail from '@/components/ProductDetail';
export default function ProductPage() {
  return <Suspense fallback={<div className="wrapper section page-section">Загрузка варианта…</div>}>
    <ProductDetail />
  </Suspense>;
}
