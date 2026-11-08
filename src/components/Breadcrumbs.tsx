import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type BreadcrumbLink = { href: string; label: string };

export const catalogCrumb = { href: '/catalog', label: 'Кубики в наличии' };

export default function Breadcrumbs({ current, ancestors = [] }: {
  current: string;
  ancestors?: BreadcrumbLink[];
}) {
  const separator = <ChevronRight className="icon" aria-hidden="true" />;
  return <nav className="breadcrumbs" aria-label="Хлебные крошки">
    <ol className="cluster" role="list">
      <li><Link href="/">Главная</Link></li>
      {ancestors.map(({ href, label }) => <li key={href}>{separator}<Link href={href}>{label}</Link></li>)}
      <li>{separator}<span aria-current="page">{current}</span></li>
    </ol>
  </nav>;
}
