'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from './CartState';
import Breadcrumbs from './Breadcrumbs';
import { fontNames, shellColors, presets } from '@/lib/catalog';
import { photoPath } from '@/lib/photoAssets';
import { formatPrice, priceForCartItem } from '@/lib/pricing';
import type { CartItem } from '@/lib/orders';

const describe = (item: CartItem) =>
  item.config.shape.toUpperCase() + ', ' +
  shellColors.find(x => x.value === item.config.shell)?.name + ', ' + fontNames[item.config.font];

export default function CartView() {
  const { items, change, remove, clear } = useCart();
  const total = items.reduce((sum, item) => sum + priceForCartItem(item) * item.quantity, 0);
  return <section className="wrapper section page-section cart-page stack">
    <Breadcrumbs current="Корзина" />
    <p className="eyebrow">Ваш выбор</p>
    <h1 className="page-title">Корзина</h1>
    {items.length === 0
      ? <div className="empty-state stack">
          <ShoppingBag className="empty-icon" aria-hidden="true" />
          <h2>Пока ничего нет</h2>
          <p>Выберите вариант из каталога или создайте свой.</p>
          <Link href="/catalog" className="button button-black">Смотреть кубики</Link>
        </div>
      : <>
        <div className="cart-lines stack">{items.map(item => {
          const presetId = 'presetId' in item.origin ? item.origin.presetId : undefined;
          const index = presetId ? presets.findIndex(x => x.id === presetId) : -1;
          return <article className="cart-entry" key={item.id}>
            <div className="cart-entry-media">
              {index >= 0
                ? <img src={photoPath(index)} alt="Игральные кубики" width={160} height={160} />
                : <ShoppingBag className="icon" aria-hidden="true" />}
            </div>
            <div className="stack cart-entry-copy">
              <h2>{index >= 0 ? presets[index].title : 'Свой вариант'} · {item.config.shape.toUpperCase()}</h2>
              <p>{shellColors.find(x => x.value === item.config.shell)?.name} · {fontNames[item.config.font]}</p>
              <p className="cart-price">{formatPrice(priceForCartItem(item))} / шт.</p>
            </div>
            <div className="cart-entry-actions stack">
              <div className="quantity cluster" aria-label={'Количество: ' + describe(item)}>
                <button aria-label={'Уменьшить количество: ' + describe(item)}
                  onClick={() => change(item.id, -1)}>
                  <Minus className="icon" aria-hidden="true" />
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button aria-label={'Увеличить количество: ' + describe(item)}
                  disabled={item.quantity >= 99} onClick={() => change(item.id, 1)}>
                  <Plus className="icon" aria-hidden="true" />
                </button>
              </div>
              <button className="text-action cart-remove cluster" aria-label={'Удалить из корзины: ' + describe(item)}
                onClick={() => remove(item.id)}><Trash2 className="icon" aria-hidden="true" /><span>Удалить</span></button>
            </div>
          </article>;
        })}</div>
        <div className="cart-summary stack">
          <h2>Итого</h2>
          <p className="cart-total">{formatPrice(total)}</p>
          <Link href="/production">Изготовление и доставка</Link>
          <Link href="/contacts#contact-form" className="button button-black">Оформить заказ</Link>
          <button type="button" className="button button-secondary" onClick={clear}>
            <Trash2 className="icon" aria-hidden="true" /><span>Очистить корзину</span>
          </button>
        </div>
      </>}
  </section>;
}
