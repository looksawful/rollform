import { Suspense } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Configurator from '@/components/Configurator';
export default function ConfigurePage() {
  return <Suspense fallback={<div className="wrapper section page-section stack">
    <Breadcrumbs current="Собери сам" />
    <p>Загрузка конструктора…</p>
  </div>}><Configurator /></Suspense>;
}
