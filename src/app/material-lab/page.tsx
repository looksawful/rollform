import type { Metadata } from 'next';
import MaterialLab from '@/components/MaterialLab';
import './material-lab.css';

export const metadata: Metadata = {
  title: 'Лаборатория материалов | ROLLFORM',
  description: 'Экспериментальные 3D-материалы и гравировка игровых кубиков ROLLFORM.',
  robots: { index: false, follow: false },
};

export default function MaterialLabPage() {
  return <MaterialLab />;
}
