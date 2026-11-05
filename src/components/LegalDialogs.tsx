'use client';

import { useEffect, useRef } from 'react';

const COOKIE_CHOICE_KEY = 'rollform:cookie-choice';

export default function LegalDialogs() {
  const cookieDialog = useRef<HTMLDialogElement>(null);
  const agreementDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let choice: string | null = null;
    try { choice = localStorage.getItem(COOKIE_CHOICE_KEY); } catch { /* Storage may be unavailable. */ }
    if (choice !== 'accepted' && choice !== 'rejected' && !cookieDialog.current?.open) {
      cookieDialog.current?.showModal();
    }
  }, []);

  const openAgreement = () => {
    const dialog = agreementDialog.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    dialog.focus();
    dialog.scrollTop = 0;
  };

  const chooseCookies = (choice: 'accepted' | 'rejected') => {
    try { localStorage.setItem(COOKIE_CHOICE_KEY, choice); } catch { /* Do not block closing. */ }
    cookieDialog.current?.close();
  };

  return <>
    <div className="legal-links stack">
      <button type="button" onClick={() => cookieDialog.current?.showModal()}>Файлы cookie</button>
      <button type="button" onClick={openAgreement}>Пользовательское соглашение</button>
    </div>

    <dialog ref={cookieDialog} className="legal-dialog stack" aria-labelledby="cookie-dialog-title">
      <h2 id="cookie-dialog-title">Файлы cookie</h2>
      <p>Сохраняем корзину и ваш выбор настроек в этом браузере. Аналитические и рекламные cookie не используем.</p>
      <div className="dialog-actions cluster">
        <button type="button" onClick={() => chooseCookies('rejected')}>Отклонить</button>
        <button type="button" className="button-black" onClick={() => chooseCookies('accepted')}>Принять все</button>
      </div>
    </dialog>

    <dialog ref={agreementDialog} tabIndex={-1} className="legal-dialog stack" aria-labelledby="agreement-dialog-title">
      <h2 id="agreement-dialog-title">Пользовательское соглашение</h2>
      <div className="prose">
        <p>Перед вами демонстрационный сайт. Этот текст служит временным образцом соглашения и не является условиями продажи.</p>
        <p>Здесь можно просматривать кубики, выбирать форму, цвет и шрифт, добавлять варианты в корзину. Эти действия не оформляют заказ и не создают обязательств по покупке или продаже.</p>
        <p>Изображения, характеристики, наличие и сведения о сроках изготовления показывают концепцию магазина. Окончательные условия будут уточнены перед запуском.</p>
        <p>Корзина и выбор настроек сохраняются локально в браузере. Их можно удалить через настройки браузера. Форма обратной связи пока не отправляет сообщения.</p>
        <p>До начала реальных продаж будут опубликованы действующие условия заказа, доставки, возврата и сведения о продавце.</p>
      </div>
      <form method="dialog">
        <button type="submit" aria-label="Закрыть пользовательское соглашение" className="button-black">Закрыть</button>
      </form>
    </dialog>
  </>;
}
