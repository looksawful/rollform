'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { themeHref } from '@/lib/themeRoutes';
import { useCart } from './CartState';
import { photoPath } from '@/lib/photoAssets';
import { formatPrice, priceForPreset } from '@/lib/pricing';
import type { Preset } from '@/lib/catalog';

export default function ProductCard({ product, index }: {
  product: Preset;
  index: number;
}) {
  const pathname = usePathname();
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const detailsUrl = themeHref(pathname, '/product?item=' + encodeURIComponent(product.id));

  const addToCart = () => {
    if (add(product.config, { kind: 'preorder_preset', presetId: product.id })) {
      setAdded(true);
    }
  };

  return <article className="product stack">
    <div className="product-media">
      <div className="product-visual frame">
        <img src={photoPath(index)} alt={'Игральные кубики: ' + product.title}
          width={1000} height={800} loading="lazy" decoding="async" />
      </div>
    </div>
    <div className="product-copy stack">
      <h3>{product.title}</h3>
      <p className="product-price">{formatPrice(priceForPreset(product.id))}</p>
    </div>
    <Link className="product-open" href={detailsUrl} aria-label={'Открыть товар: ' + product.title} />
    <div className="product-actions">
      <button type="button" className="button button-secondary" onClick={addToCart}
        aria-label={'Добавить в корзину: ' + product.title}>Добавить в корзину</button>
      <span className="visually-hidden" role="status">{added ? 'Товар добавлен в корзину' : ''}</span>
    </div>
  </article>;
}
