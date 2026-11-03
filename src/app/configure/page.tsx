import { Suspense } from 'react';
import Configurator from '@/components/Configurator';
export default function ConfigurePage() {
  return <Suspense fallback={<p className="wrapper section">Загрузка конструктора…</p>}><Configurator /></Suspense>;
}
