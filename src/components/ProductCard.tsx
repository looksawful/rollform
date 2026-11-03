'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DiceGlyph from './DiceGlyph';
import { useCart } from './CartState';
import type { Preset } from '@/lib/catalog';

export default function ProductCard({ product, index }: { product: Preset; index: number }) {
  const router = useRouter();
  const cart = useCart();
  const available = product.fulfillment.kind === 'in_stock' ? product.fulfillment.available : undefined;
  const inStock = available !== undefined && available > 0;
  const soldOut = product.fulfillment.kind === 'in_stock' && !inStock;
  const add = () => {
    if (soldOut) return;
    const ok = cart.add(product.config, { kind: inStock ? 'in_stock' : 'preorder_preset', presetId: product.id }, available);
    if (ok) router.push('/cart');
  };
  return <article className="product stack">
    <div className="product-visual pile" aria-label={`Превью: ${product.title}`}>
      <span className="product-index">{String(index + 1).padStart(2, '0')} / {product.config.shape.toUpperCase()}</span>
      <DiceGlyph shape={product.config.shape} />
      <span className="product-status">{inStock ? 'В наличии' : soldOut ? 'Нет в наличии' : 'Предзаказ · демо'}</span>
    </div>
    <div className="product-bottom cluster">
      <div className="stack product-copy"><h3>{product.title}</h3><p><span className="product-color-dot" style={{ background: product.config.shell }} aria-hidden="true" /> {product.config.shape.toUpperCase()} / {product.config.font}</p></div>
      <button className="product-add" type="button" aria-label={`Добавить ${product.title} в корзину`} onClick={add} disabled={soldOut}>+</button>
    </div>
    <Link className="product-detail-link" href={`/configure?shape=${encodeURIComponent(product.config.shape)}`}>Изменить форму <span aria-hidden="true">↗</span></Link>
  </article>;
}
