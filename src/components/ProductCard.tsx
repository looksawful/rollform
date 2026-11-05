'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ZoomIn } from 'lucide-react';
import { themeHref } from '@/lib/themeRoutes';
import { useCart } from './CartState';
import { fontNames, shellColors } from '@/lib/catalog';
import { photoPath } from '@/lib/photoAssets';
import { formatPrice, priceForPreset } from '@/lib/pricing';
import type { Preset } from '@/lib/catalog';

export default function ProductCard({ product, index, onPreview }: {
  product: Preset;
  index: number;
  onPreview: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { add } = useCart();
  const detailsUrl = themeHref(pathname, '/product?item=' + encodeURIComponent(product.id));
  const description = [
    product.config.shape.toUpperCase(),
    shellColors.find(color => color.value === product.config.shell)?.name,
    fontNames[product.config.font],
  ].join(' · ');

  const buy = () => {
    if (add(product.config, { kind: 'preorder_preset', presetId: product.id })) {
      router.push(themeHref(pathname, '/cart'));
    }
  };

  return <article className="product stack">
    <div className="product-media">
      <Link className="product-visual frame" href={detailsUrl} aria-label={'Подробнее: ' + product.title}>
        <img src={photoPath(index)} alt={'Игральные кубики: ' + product.title}
          width={1000} height={800} loading="lazy" decoding="async" />
      </Link>
      <button className="product-zoom" type="button" onClick={onPreview}
        aria-label={'Увеличить изображение: ' + product.title}>
        <ZoomIn className="icon" aria-hidden="true" />
      </button>
    </div>
    <div className="product-copy stack">
      <h3><Link href={detailsUrl}>{product.title}</Link></h3>
      <p className="product-description">{description}</p>
      <p className="product-price">{formatPrice(priceForPreset(product.id))}</p>
    </div>
    <div className="product-actions">
      <button type="button" className="button button-black" onClick={buy}
        aria-label={'Купить: ' + product.title}>Купить</button>
    </div>
  </article>;
}
