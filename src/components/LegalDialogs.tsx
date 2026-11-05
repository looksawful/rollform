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

  const chooseCookies = (choice: 'accepted' | 'rejected') => {
    try { localStorage.setItem(COOKIE_CHOICE_KEY, choice); } catch { /* Do not block closing. */ }
    cookieDialog.current?.close();
  };

  return <>
    <div className="legal-links stack">
      <button type="button" onClick={() => cookieDialog.current?.showModal()}>Файлы Cookie</button>
      <button type="button" onClick={() => agreementDialog.current?.showModal()}>Пользовательское соглашение</button>
    </div>

    <dialog ref={cookieDialog} className="legal-dialog stack" aria-labelledby="cookie-dialog-title">
      <h2 id="cookie-dialog-title">Файлы Cookie</h2>
      <p>Текст</p>
      <div className="dialog-actions cluster">
        <button type="button" onClick={() => chooseCookies('rejected')}>Отклонить</button>
        <button type="button" className="button-black" onClick={() => chooseCookies('accepted')}>Принять</button>
      </div>
    </dialog>

    <dialog ref={agreementDialog} className="legal-dialog stack" aria-labelledby="agreement-dialog-title">
      <h2 id="agreement-dialog-title">Пользовательское соглашение</h2>
      <p>Текст</p>
      <form method="dialog">
        <button type="submit" aria-label="Закрыть пользовательское соглашение" className="button-black">Кнопка</button>
      </form>
    </dialog>
  </>;
}
