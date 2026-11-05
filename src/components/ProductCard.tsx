'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { themeHref } from '@/lib/themeRoutes';
import { useCart } from './CartState';
import { fontNames, shellColors } from '@/lib/catalog';
import type { Preset } from '@/lib/catalog';

export default function ProductCard({ product }: { product: Preset }) {
  const router = useRouter();
  const pathname = usePathname();
  const { add } = useCart();
  const addToCart = () => {
    if (add(product.config, { kind: 'preorder_preset', presetId: product.id })) router.push(themeHref(pathname, '/cart'));
  };
  const url = themeHref(pathname, '/configure?preset=' + encodeURIComponent(product.id));
  return <article className="product stack">
    <Link className="product-visual frame" href={url}
      aria-label={'Настроить ' + product.config.shape.toUpperCase()}>
      <img
        src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/products/${product.id}.webp`}
        alt=""
        width={360} height={360} loading="lazy" decoding="async"
      />
    </Link>
    <div className="product-copy stack">
      <h3>{product.title}</h3>
      <div className="product-badges cluster" aria-label="Параметры варианта">
        <span>{product.config.shape.toUpperCase()}</span>
        <span>{shellColors.find(color => color.value === product.config.shell)?.name}</span>
        <span>{fontNames[product.config.font]}</span>
      </div>
    </div>
    <div className="product-actions cluster">
      <button type="button" onClick={addToCart} aria-label={'В корзину: ' + product.config.shape.toUpperCase()}>В корзину</button>
    </div>
  </article>;
}
