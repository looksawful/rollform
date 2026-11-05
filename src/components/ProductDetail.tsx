'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { presets, fontNames, shellColors } from '@/lib/catalog';
import { photoPath } from '@/lib/photoCredits';
import { themeHref } from '@/lib/themeRoutes';
import { useCart } from './CartState';

export default function ProductDetail() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [view, setView] = useState<'photo' | 'model'>('photo');
  const { add } = useCart();
  const index = Math.max(0, presets.findIndex(p => p.id === params.get('item')));
  const product = presets[index];
  const photo = photoPath(index);
  const model = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/products/${product.id}.webp`;
  const buy = () => {
    if (add(product.config, { kind: 'preorder_preset', presetId: product.id })) {
      router.push(themeHref(pathname, '/cart'));
    }
  };
  return <section className="wrapper section page-section product-detail-page">
    <Link className="breadcrumb" href={themeHref(pathname, '/catalog')}>
      <ArrowLeft className="icon" aria-hidden="true" /> Все кубики
    </Link>
    <div className="product-detail">
      <div className="product-detail-gallery">
        <div className="product-detail-main">
          <img key={view} src={view === 'photo' ? photo : model}
            alt={view === 'photo' ? 'Фотография других игровых кубиков, пример' : '3D-визуализация выбранного варианта'}
            width={1000} height={900} />
        </div>
        <div className="product-detail-thumbs cluster" aria-label="Вид товара">
          <button type="button" aria-pressed={view === 'photo'} onClick={() => setView('photo')}>
            <img src={photo} alt="" width={80} height={80} /> Фото-пример
          </button>
          <button type="button" aria-pressed={view === 'model'} onClick={() => setView('model')}>
            <img src={model} alt="" width={80} height={80} /> 3D-вариант
          </button>
        </div>
        <p className="photo-disclaimer">Фотография приведена как референс и не изображает продукцию ROLLFORM.</p>
      </div>
      <div className="product-detail-content stack">
        <p className="eyebrow">Кубики / Вариант на заказ</p>
        <h1 className="page-title">{product.title}</h1>
        <p>Форма {product.config.shape.toUpperCase()}. Цвет и шрифт можно изменить в конструкторе.</p>
        <dl className="product-specs">
          <div><dt>Форма</dt><dd>{product.config.shape.toUpperCase()}</dd></div>
          <div><dt>Цвет</dt><dd>{shellColors.find(x => x.value === product.config.shell)?.name}</dd></div>
          <div><dt>Шрифт</dt><dd>{fontNames[product.config.font]}</dd></div>
        </dl>
        <p className="detail-price">Цена уточняется</p>
        <button type="button" className="button button-black button-fill" onClick={buy}>
          Купить <ShoppingBag className="icon" aria-hidden="true" />
        </button>
        <Link className="button button-fill" href={themeHref(pathname, '/configure?preset=' + product.id)}>
          Настроить вариант
        </Link>
        <Link className="detail-delivery" href={themeHref(pathname, '/production')}>Изготовление и доставка</Link>
      </div>
    </div>
  </section>;
}
