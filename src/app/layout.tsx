import type { Metadata } from 'next';
import SiteShell from '@/components/SiteShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'ROLLFORM · прототип',
  description: 'Прототип интерфейса магазина игральных кубиков для разработки и просмотра.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><SiteShell>{children}</SiteShell></body></html>;
}
