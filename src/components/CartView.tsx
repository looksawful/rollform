'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './CartState';
import { fontNames, shellColors } from '@/lib/catalog';
import { makeOrderText } from '@/lib/orders';
import type { CartItem, CartOrigin } from '@/lib/orders';

const label = (origin: CartOrigin) => origin.kind === 'in_stock' ? 'В наличии'
  : origin.kind === 'preorder_preset' ? 'Предзаказ варианта' : 'Свой вариант';

const describe = (item: CartItem) =>
  `${item.config.shape.toUpperCase()}, ${shellColors.find(x => x.value === item.config.shell)?.name}, ${fontNames[item.config.font]}, ${label(item.origin)}`;

export default function CartView() {
  const { items, count, change, remove } = useCart();
  const [copyStatus, setCopyStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const draft = makeOrderText(items);
  const copied = copyStatus?.text === draft && copyStatus.ok;
  const copyFailed = copyStatus?.text === draft && !copyStatus.ok;
  return <section className="wrapper section page-section stack">
    <h1 className="page-title">Корзина <small>({count})</small></h1>
    {items.length === 0 ? <div className="empty-state stack"><p>Корзина пуста</p><Link href="/configure" className="button button-black">Собрать кубик</Link></div> : <div className="cart-layout">
      <div className="cart-lines stack">{items.map(item => <article className="cart-entry" key={item.id}>
        <div className="stack cart-entry-copy"><h2>{item.config.shape.toUpperCase()}</h2><p>{shellColors.find(x => x.value === item.config.shell)?.name} / {fontNames[item.config.font]}</p></div>
        <div className="cart-entry-actions stack"><div className="quantity cluster"><button aria-label={`Уменьшить количество: ${describe(item)}`} disabled={item.quantity <= 1} onClick={() => change(item.id, -1)}>−</button><span aria-live="polite">{item.quantity}</span><button aria-label={`Увеличить количество: ${describe(item)}`} disabled={item.quantity >= 99} onClick={() => change(item.id, +1)}>+</button></div><button className="text-action" aria-label={`Удалить: ${describe(item)}`} onClick={() => remove(item.id)}>Удалить</button></div>
      </article>)}</div>
      <div className="order-draft stack"><h2>Черновик</h2><p>Демо. Заявка не отправляется.</p><textarea id="order-text" aria-label="Состав черновика" rows={12} readOnly value={draft}/><button className="button button-black button-fill" onClick={async () => { try { await navigator.clipboard.writeText(draft); setCopyStatus({ text: draft, ok: true }); } catch { setCopyStatus({ text: draft, ok: false }); } }}>{copied ? 'Скопировано' : 'Копировать'}</button><p role="status">{copyFailed ? 'Не удалось скопировать. Выделите текст выше вручную.' : copied ? 'Скопировано' : ''}</p></div>
    </div>}
  </section>;
}
