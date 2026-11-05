'use client';

import type { FormEvent } from 'react';
import { Mail, Send } from 'lucide-react';

const channels = [
  { title: 'Электронная почта', detail: 'i@lookawful.ru', href: 'mailto:i@lookawful.ru', Icon: Mail },
  { title: 'Telegram', detail: '@looksawful', href: 'https://t.me/looksawful', Icon: Send },
];

export default function ContactContent() {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const reply = String(data.get('reply') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!name || !reply || !message) return;
    const subject = encodeURIComponent('Вопрос о кубиках');
    const body = encodeURIComponent(`Имя: ${name}\nПочта: ${reply}\n\n${message}`);
    window.location.href = `mailto:i@lookawful.ru?subject=${subject}&body=${body}`;
  };
  return <div className="contact-content switcher">
    <div className="stack contact-options">
      <h3>Связаться с нами</h3>
      <ul className="contact-methods stack">
        {channels.map(({ title, detail, href, Icon }) =>
          <li className="contact-method" key={title}>
            <a className="cluster" href={href} {...(href.startsWith('https:') ? { target: '_blank', rel: 'noreferrer' } : {})}>
              <Icon className="icon" aria-hidden="true" />
              <span className="stack"><strong>{title}</strong><span>{detail}</span></span>
            </a>
          </li>
        )}
      </ul>
    </div>
    <form className="contact-form stack" onSubmit={onSubmit}>
      <h3>Написать нам</h3>
      <label className="stack" htmlFor="contact-name">Имя
        <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={80} />
      </label>
      <label className="stack" htmlFor="contact-reply">Электронная почта
        <input id="contact-reply" name="reply" type="email" autoComplete="email" required maxLength={150} />
      </label>
      <label className="stack" htmlFor="contact-message">Сообщение
        <textarea id="contact-message" name="message" rows={4} required maxLength={1500} />
      </label>
      <button className="button button-black" type="submit">Написать</button>
    </form>
  </div>;
}
