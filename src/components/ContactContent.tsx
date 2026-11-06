'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Globe, Mail, Phone } from 'lucide-react';

const channels = [
  { title: 'Сайт', detail: 'kubiki.example', Icon: Globe },
  { title: 'Электронная почта', detail: 'hello@kubiki.example', Icon: Mail },
  { title: 'Телефон', detail: '+7 (000) 000-00-00', Icon: Phone },
];

export default function ContactContent() {
  const [submitted, setSubmitted] = useState(false);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };
  return <div className="contact-content switcher">
    <div className="stack contact-options">
      <h3>Связаться с нами</h3>
      <p>Здесь позже появятся настоящие способы связи с командой проекта. Сейчас размещены временные реквизиты для проверки оформления контактного блока. Адреса и телефон ниже демонстрационные и не предназначены для связи.</p>
      <ul className="contact-methods stack">
        {channels.map(({ title, detail, Icon }) =>
          <li className="contact-method" key={title}>
            <div className="cluster">
              <Icon className="icon" aria-hidden="true" />
              <span className="stack"><strong>{title}</strong><span>{detail}</span></span>
            </div>
          </li>
        )}
      </ul>
    </div>
    <form className="contact-form stack" onSubmit={onSubmit} onInput={() => setSubmitted(false)} aria-describedby="contact-demo-note">
      <h3>Написать нам</h3>
      <p id="contact-demo-note">Это демонстрационная форма. Сообщения не отправляются и не сохраняются.</p>
      <label className="stack" htmlFor="contact-name">Имя
        <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={80} />
      </label>
      <label className="stack" htmlFor="contact-reply">Электронная почта
        <input id="contact-reply" name="reply" type="email" autoComplete="email" required maxLength={150} />
      </label>
      <label className="stack" htmlFor="contact-message">Сообщение
        <textarea id="contact-message" name="message" rows={4} required maxLength={1500} />
      </label>
      <button className="button button-black" type="submit">Проверить форму</button>
      {submitted && <p role="status">Форма проверена. Это прототип: сообщение не отправлено.</p>}
    </form>
  </div>;
