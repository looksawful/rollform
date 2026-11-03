'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './CartState';
import { fontNames, shellColors } from '@/lib/catalog';
import { makeOrderText } from '@/lib/orders';
import type { CartOrigin } from '@/lib/orders';

const label = (origin: CartOrigin) => origin.kind === 'in_stock' ? 'В наличии'
  : origin.kind === 'preorder_preset' ? 'Предзаказ варианта' : 'Свой вариант';

export default function CartView() {
  const { items, count, change, remove } = useCart();
  const [copied, setCopied] = useState(false);
  return <section className="wrapper section page-section stack">
    <span className="kicker">КОРЗИНА / ДЕМО</span><h1 className="page-title">Корзина <small>({count})</small></h1>
    {items.length === 0 ? <div className="empty-state stack"><p>Здесь пока пусто.</p><Link href="/catalog" className="button button-black">В каталог ↗</Link></div> : <div className="cart-layout">
      <div className="cart-lines stack">{items.map(item => <article className="cart-entry" key={item.id}>
        <div className="cart-swatch" style={{ background: item.config.shell, color: item.config.ink }} aria-hidden="true">{item.config.shape.toUpperCase()}</div>
        <div className="stack cart-entry-copy"><h2>{item.config.shape.toUpperCase()}</h2><p>{label(item.origin)}</p><p>{shellColors.find(x => x.value === item.config.shell)?.name} / {fontNames[item.config.font]}</p></div>
        <div className="cart-entry-actions stack"><div className="quantity cluster"><button aria-label={`Уменьшить количество: ${item.config.shape.toUpperCase()}, ${label(item.origin)}`} onClick={() => change(item.id, -1)}>−</button><span aria-live="polite">{item.quantity}</span><button aria-label={`Увеличить количество: ${item.config.shape.toUpperCase()}, ${label(item.origin)}`} onClick={() => change(item.id, +1)}>+</button></div><button className="text-action" onClick={() => remove(item.id)}>Удалить</button></div>
      </article>)}</div>
      <div className="order-draft stack"><h2>Черновик заявки</h2><p>Это только прототип. Ничего не отправляется и не оплачивается.</p><label htmlFor="order-text">Состав</label><textarea id="order-text" rows={12} readOnly value={makeOrderText(items)}/><button className="button button-black button-fill" onClick={async () => { try { await navigator.clipboard.writeText(makeOrderText(items)); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Текст скопирован' : 'Копировать текст'} ↗</button></div>
    </div>}
  </section>;
}
