'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCart } from './CartState';
import { photoPath } from '@/lib/photoAssets';
import { formatPrice, priceForPreset } from '@/lib/pricing';
import { shellColors } from '@/lib/catalog';
import type { Preset } from '@/lib/catalog';

export default function ProductCard({ product, index, duplicate = false }: {
  product: Preset;
  index: number;
  duplicate?: boolean;
}) {
  const { add, items } = useCart();
  const [announcement, setAnnouncement] = useState('');
  const quantity = items.filter(item =>
    item.origin.kind === 'preorder_preset' && item.origin.presetId === product.id
  ).reduce((sum, item) => sum + item.quantity, 0);
  const detailsUrl = '/product?item=' + encodeURIComponent(product.id);
  const colorName = shellColors.find(color => color.value === product.config.shell)?.name;
  const attributes = `${product.config.shape.toUpperCase()} · ${colorName ?? product.config.shell}`;

  const addToCart = () => {
    if (quantity >= 99) {
      setAnnouncement(`${product.title}: максимум 99 в корзине`);
      return;
    }
    const updatedQuantity = add(product.config, { kind: 'preorder_preset', presetId: product.id });
    setAnnouncement(updatedQuantity !== false
      ? `${product.title}: добавлено в корзину, теперь ${updatedQuantity}`
      : `${product.title}: максимум 99 в корзине`);
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
      <p className="product-attributes">{attributes}</p>
      <p className="product-price">{formatPrice(priceForPreset(product.id))}</p>
    </div>
    <Link className="product-open" href={detailsUrl} tabIndex={duplicate ? -1 : undefined}
      aria-label={'Открыть товар: ' + product.title} />
    <div className="product-actions">
      <button type="button" className="button button-secondary" onClick={addToCart}
        tabIndex={duplicate ? -1 : undefined}
        aria-label={'Добавить в корзину: ' + product.title + (quantity ? ', в корзине ' + quantity : '')}>
        <Plus className="icon" aria-hidden="true" />
        <span className="product-add-label">Добавить в корзину</span>
        {quantity > 0 && <span className="product-add-count" key={quantity} aria-hidden="true">{quantity}</span>}
      </button>
      {!duplicate && <span className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>}
    </div>
  </article>;
}
