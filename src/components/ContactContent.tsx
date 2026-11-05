'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Camera, Mail, Phone, Send } from 'lucide-react';

const channels = [
  { title: 'Почта', Icon: Mail },
  { title: 'Телефон', Icon: Phone },
  { title: 'Telegram', Icon: Send },
  { title: 'Instagram', Icon: Camera },
];

export default function ContactContent() {
  const [attempted, setAttempted] = useState(false);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
  };
  return <div className="contact-content switcher">
    <div className="stack contact-options">
      <h3>Способы связи</h3>
      <ul className="contact-methods stack">
        {channels.map(({ title, Icon }) =>
          <li className="contact-method cluster" key={title}>
            <Icon className="icon" aria-hidden="true" />
            <span>{title}</span>
          </li>
        )}
      </ul>
      <p className="contact-availability">Данные для связи уточняются.</p>
    </div>
    <form className="contact-form stack" onSubmit={onSubmit}>
      <h3>Написать нам</h3>
      <p>Форма для демонстрации. Сообщения не отправляются.</p>
      <label className="stack" htmlFor="contact-name">Имя
        <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={80} />
      </label>
      <label className="stack" htmlFor="contact-reply">Контакт для ответа
        <input id="contact-reply" name="reply" type="text" required maxLength={150} />
      </label>
      <label className="stack" htmlFor="contact-message">Сообщение
        <textarea id="contact-message" name="message" rows={4} required maxLength={1500} />
      </label>
      <button className="button button-black" type="submit">Отправить</button>
      {attempted && <p role="status">Сообщение не отправлено: форма работает в демонстрационном режиме.</p>}
    </form>
  </div>;
}
