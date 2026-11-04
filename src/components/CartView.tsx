'use client';

import Link from 'next/link';
import { useCart } from './CartState';
import { fontNames, shellColors } from '@/lib/catalog';
import type { CartItem } from '@/lib/orders';

const describe = (item: CartItem) =>
  item.config.shape.toUpperCase() + ', ' +
  shellColors.find(x => x.value === item.config.shell)?.name + ', ' + fontNames[item.config.font];

export default function CartView() {
  const { items, change, remove } = useCart();
  return <section className="wrapper section page-section stack">
    <h1 className="page-title">Корзина</h1>
    {items.length === 0
      ? <div className="empty-state stack"><p>Текст</p><Link href="/configure" className="button button-black">Кнопка</Link></div>
      : <div className="cart-lines stack">{items.map(item => <article className="cart-entry" key={item.id}>
          <div className="stack cart-entry-copy">
            <h2>{item.config.shape.toUpperCase()}</h2>
            <p>{shellColors.find(x => x.value === item.config.shell)?.name} / {fontNames[item.config.font]}</p>
          </div>
          <div className="cart-entry-actions stack">
            <div className="quantity cluster">
              <button aria-label={'Уменьшить количество: ' + describe(item)}
                disabled={item.quantity <= 1} onClick={() => change(item.id, -1)}>−</button>
              <span aria-live="polite">{item.quantity}</span>
              <button aria-label={'Увеличить количество: ' + describe(item)}
                disabled={item.quantity >= 99} onClick={() => change(item.id, +1)}>+</button>
            </div>
            <button className="text-action" aria-label={'Удалить: ' + describe(item)}
              onClick={() => remove(item.id)}>Кнопка</button>
          </div>
        </article>)}</div>}
  </section>;
}
