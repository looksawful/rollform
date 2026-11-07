'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Orbit, ShoppingBag } from 'lucide-react';
import { presets, fontNames, shellColors } from '@/lib/catalog';
import { photoPath } from '@/lib/photoAssets';
import { formatPrice, priceForPreset } from '@/lib/pricing';
import DiceViewer from './DiceViewer';
import { useCart } from './CartState';

export default function ProductDetail() {
  const params = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<number | 'model'>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { add } = useCart();
  const index = Math.max(0, presets.findIndex(p => p.id === params.get('item')));
  const product = presets[index];
  const photos = [photoPath(index), photoPath((index + 1) % presets.length), photoPath((index + 2) % presets.length)];
  const buy = () => {
    if (add(product.config, { kind: 'preorder_preset', presetId: product.id })) {
      router.push('/cart');
    }
  };
  return <section className="wrapper section page-section product-detail-page">
    <Link className="breadcrumb" href={'/catalog'}>
      <ArrowLeft className="icon" aria-hidden="true" /> Все кубики
    </Link>
    <div className="product-detail">
      <div className="product-detail-gallery">
        <div className="product-detail-main">
          {view === 'model' ? <DiceViewer config={product.config} /> :
            <button className="product-detail-photo-trigger" type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={'Увеличить изображение: ' + product.title}>
              <img src={photos[view]} alt="Игральные кубики, пример" width={1000} height={900} />
            </button>}
        </div>
        <div className="product-detail-thumbs cluster" aria-label="Вид товара">
          {photos.map((photo, number) => (
            <button key={photo} type="button" aria-label={`Фото ${number + 1}`} aria-pressed={view === number} onClick={() => setView(number)}>
              <img src={photo} alt="" width={80} height={80} />
            </button>
          ))}
          <button type="button" aria-pressed={view === 'model'} onClick={() => setView('model')}>
            <Orbit className="icon" aria-hidden="true" /> 3D-вариант
          </button>
        </div>
      </div>
      <div className="product-detail-content stack">
        <p className="eyebrow">Кубики / В наличии</p>
        <h1 className="page-title">{product.title}</h1>
        <p>Форма {product.config.shape.toUpperCase()}. Цвет и шрифт можно изменить в конструкторе.</p>
        <p>Готовые варианты доставляем по Москве и регионам в течение 3 дней. Самовывоз бесплатный.</p>
        <dl className="product-specs">
          <div><dt>Форма</dt><dd>{product.config.shape.toUpperCase()}</dd></div>
          <div><dt>Цвет</dt><dd>{shellColors.find(x => x.value === product.config.shell)?.name}</dd></div>
          <div><dt>Шрифт</dt><dd>{fontNames[product.config.font]}</dd></div>
        </dl>
        <p className="detail-price">{formatPrice(priceForPreset(product.id))}</p>
        <button type="button" className="button button-black button-fill" onClick={buy}>
          Купить <ShoppingBag className="icon" aria-hidden="true" />
        </button>
        <Link className="button button-fill" href={'/configure?preset=' + product.id}>
          Настроить вариант
        </Link>
        <Link className="detail-delivery" href={'/production'}>Изготовление и доставка</Link>
      </div>
    </div>
    <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)}
      index={view === 'model' ? 0 : view}
      slides={photos.map((src, number) => ({ src, alt: `Игральные кубики, пример ${number + 1}` }))}
      carousel={{ finite: true }}
      labels={{ Close: 'Закрыть', Previous: 'Предыдущее изображение', Next: 'Следующее изображение' }}
    />
  </section>;
}
