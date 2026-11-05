'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { presets } from '@/lib/catalog';
import ProductCard from './ProductCard';

const slides = presets.map(product => ({
  src: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/products/${product.id}.webp`,
  width: 360,
  height: 360,
  alt: `Иллюстрация ${product.title}, ${product.config.shape.toUpperCase()}`,
}));

export default function ProductGallery({ mode }: { mode: 'grid' | 'reel' }) {
  const [active, setActive] = useState<number | null>(null);
  return <>
    <div className={mode === 'reel' ? 'product-scroller reel' : 'product-grid grid'}
      {...(mode === 'reel' ? { role: 'region', 'aria-label': 'В наличии', tabIndex: 0 } : {})}>
      {presets.map((product, index) =>
        <ProductCard key={product.id} product={product} onPreview={() => setActive(index)} />)}
    </div>
    <Lightbox
      open={active !== null}
      close={() => setActive(null)}
      index={active ?? 0}
      slides={slides}
      carousel={{ finite: true }}
      labels={{ Close: 'Закрыть', Previous: 'Предыдущее изображение', Next: 'Следующее изображение' }}
    />
  </>;
}
