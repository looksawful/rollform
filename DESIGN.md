# ROLLFORM · Дизайн-система (RF-01 / RF-02)

> Актуально для исходников `main` на 8 ноября 2026 года. **Источник истины — CSS и TSX**, а не этот документ. Здесь нет новых токенов или новых компонентов. Прототип не принимает оплату и заявки.

## 1. Архитектура и источники

- `src/app/globals.css` задаёт каскад: `@layer theme, base, layouts, components, utilities` и импортирует `tokens.css`, `base.css`, `patterns.css`, `components.css`, `sections.css`, `responsive.css`, `pages.css`.
- `src/styles/tokens.css` содержит глобальные токены и семантические значения `.site`; `src/styles/base.css` — reset, шрифт, `:focus-visible`; `src/styles/patterns.css` — алгоритмы компоновки. Страницы определяют только локальные варианты.
- **Нет отдельных React-компонентов `Button`, `ChoicePill`, `Price`, `Gallery`, `CartLine`, `FormField`, `Menu`.** Это повторяемые CSS-паттерны или части существующих `ProductCard`, `Configurator`, `ProductDetail`, `ProductGallery`, `CartView`, `ContactContent`, навигации. Не создавать абстракции без второго реального потребителя.

## 2. Визуальные токены — фактические значения

| Роль | CSS | Значение |
| --- | --- | --- |
| Шрифт | `--ff-body` | Inter, Arial, Helvetica, sans-serif |
| Текст | `--fs-body` / `--lh-body` | 1rem / 1.55 |
| Мелкий текст | `--fs-small` / `--lh-small` | 0.875rem / 1.45 |
| Заголовок карточки | `--fs-title` / `--lh-title` | clamp(1.125rem, 1.05rem + 0.3vw, 1.375rem) / 1.25 |
| Заголовок секции | `--fs-heading` / `--lh-heading` | clamp(2rem, 1.45rem + 2vw, 3.625rem) / 1.1 |
| Крупный display | `--fs-display` / `--lh-display` | clamp(2.75rem, 1.75rem + 4vw, 5.75rem) / 1.02 |
| Трекинг | `--tracking-heading` / `--tracking-display` | -0.02em / -0.03em |
| Горизонтальный отступ | `--gutter` | clamp(1.25rem, 3.5vw, 4.5rem) |
| Контейнер / длина строки | `--content-max` / `--measure` | 94rem / 62ch |
| Высота шапки | `--header-height` | 5.25rem |
| Скругления | `--radius-sm/md/lg/full` | 0.75rem / 1rem / 1.75rem / 999px |
| Шаги расстояний | `--space-1/2/3` | 0.5rem / 1rem / 1.5rem |
| Крупные расстояния | `--space-4/5` | clamp(1.5rem, 3vw, 3.5rem) / clamp(3rem, 5.5vw, 6rem) |
| Контрастные примитивы | `--color-black/white` | #000000 / #ffffff |
| Фон сайта / текст / поверхность | `--color-background/text/surface` | #fafafa / #000000 / #ffffff (в светлой `.site`) |
| Обводка | `--color-border` / `--border-default` | rgb(0 0 0 / 0.14) / 1px solid var(--color-border) |
| Тень | `--shadow-card` | 0 8px 24px rgb(0 0 0 / 0.035) |
| Акцентное действие | `--color-action/on-action` | var(--color-text) / var(--color-background) |
| Фокус | `--color-focus` | var(--color-text) |
| Фон 3D / надпись | `--color-preview/preview-ink/dice-label` | белый / чёрный / белый |

`.site[data-theme="dark"]` содержит сохранённые альтернативные значения, **но переключатель темы сейчас отключён** по решению проекта. Не активировать его в этом пакете. Размеры в rem привязаны к настройке пользователя; при базовых 16px 0.875rem = 14px.

## 3. Повторяемые компоновочные паттерны

- `.wrapper`: ширина `min(100% - var(--gutter) * 2, var(--content-max))`, центрирование.
- `.stack`: вертикальный flex, `gap: var(--stack-space, var(--space-2))`. Варианты задают `--stack-space` локально; не вставлять произвольные `margin-bottom` между дочерними элементами.
- `.cluster`: flex-wrap, alignment через `--cluster-align`, `--cluster-justify`, `--cluster-gap`.
- `.grid`: auto-fit/minmax с `--grid-min` (18rem по умолчанию), `--grid-gap`.
- `.reel`: горизонтальная сетка, overflow и scroll-snap; специальная `.product-scroller` расширяет её анимацией.
- `.prose`: обычный текстовый поток с `--prose-gap` и `--prose-heading-gap`; `.frame`, `.sidebar`, `.switcher`, `.box` — вспомогательные композиции.
- Типографические группы: `.page-heading > .page-title`, `.section-title` для секций, `.product-copy.stack` для заголовка и цены, `.cart-entry-copy.stack` для товара и метаданных, `.contact-form .prose` для заголовка/лида, `.field.stack` для подписи и набора вариантов. Локальные интервалы определяются контекстом, не вторым набором токенов.

## 4. Инвентарь состояний (только реально существующее)

Обозначения: **есть** — реализовано в исходниках; **частично** — визуальное или семантическое поведение неполно; **нет** — не предусмотрено и не следует придумывать без сценария.

| Паттерн / реальный владелец | default | hover | focus-visible | selected / pressed | disabled | loading / error / empty |
| --- | --- | --- | --- | --- | --- | --- |
| Button: `.button`, `.button-black`, `.button-secondary` в страницах | есть | есть (подъём/инверсия) | глобальный outline | active CSS | нет общего API, native button допускает disabled | нет общего async-состояния, не нужно |
| ChoicePill: `.pill-list button` в `Configurator.tsx` | есть | есть | глобальный outline | `aria-pressed` + `.is-active` | нет | нет |
| ProductCard: `ProductCard.tsx` | есть | `.product:hover`, action | глобальный outline на ссылке/кнопке | количество в корзине и `role=status` | нет | изображения с `loading="lazy"`; **нет** UI загрузки/ошибки |
| Price: `.product-price`, `.configure-price`, `.cart-price`, `.cart-total` | есть | не требуется | неинтерактивный | не требуется | не требуется | нет, синхронный расчёт |
| Gallery: `ProductGallery.tsx`, `ProductDetail.tsx` | есть | карточки и миниатюры | глобальный outline | `aria-pressed` у миниатюр, `view` фото/3D | нет | браузерный lazy-load; lightbox на странице товара |
| DiceViewer: `DiceViewer.tsx` | есть | не кнопка | tabindex=0 кроме Hero | auto → manual при взаимодействии | нет | `fallback` при WebGL/модели, context lost/restored; отдельного loading UI нет |
| CartLine: `.cart-entry` в `CartView.tsx` | есть | quantity/remove | глобальный outline | `aria-live` у количества | `disabled` у плюса при 99 | empty-state для пустой корзины; async loading нет |
| FormField: `ContactContent.tsx` | есть | браузерный | глобальный outline | input/textarea focus | native required | native validation; `role=status` при демо-submit, backend отсутствует |
| Menu: `.nav`, `.mobile-menu` | есть | ссылки | глобальный outline | `aria-current="page"`, details open | нет | нет |

Важные отличия: Hero `DiceViewer continuous=true` не интерактивен и не попадает в tab order; остальные 3D управляются pointer/стрелками. Карусель может иметь дубли карточек для бесконечной прокрутки, у дубликатов отключён tab order. Нельзя объявлять наличие loading/error для всех компонентов только ради симметрии таблицы.

## 5. Семантический контракт для следующих изменений

1. Интерактивные действия — `button type="button"` (или submit для формы); переходы — `a`/`Link`. Для выбранных вариантов сохранять синхронность `aria-pressed` и `.is-active`; для текущей страницы — `aria-current="page"`.
2. Базовый `:focus-visible` уже установлен в `base.css`: `outline: 2px solid var(--color-focus); outline-offset: 4px`. Сначала проверить, не обрезается ли он `overflow:hidden` у конкретного компонента. Не добавлять второй глобальный outline.
3. `.button` имеет `min-block-size: 3.25rem`, `.quantity button` — 2.75rem, `.pill-list button` имеет min-inline-size 4.5rem. На узких экранах есть локальное правило `.product-grid .product-actions .button { font-size: 0.75rem }` — **известный кандидат на RF-03**, не менять в RF-02, чтобы избежать конфликта с исполнителем каталога.
4. `prefers-reduced-motion` уже отключает анимацию кнопок и влияет на карусель/3D; сохранять эти исключения.
5. Статические цены не требуют `aria-live`; динамическое подтверждение корзины уже находится в `ProductCard`. Не плодить одинаковые live-region на каждом уровне.
6. Тексты/данные временные, не дополнять их выдуманными свойствами. Все изменения визуальной системы должны опираться на реальный компонент и тестируемый дефект.

## 6. Контроль RF-01 / RF-02 и передача

**RF-01:** инвентарь реальных владельцев, CSS-контрактов и состояний зафиксирован выше. Отдельные компоненты не создавались.

**RF-02:** существующие токены, `.stack`, `.cluster`, `.wrapper`, `.grid`, `.prose` и общий `:focus-visible` уже присутствуют. Изолированная инвентаризация не выявила необходимости переписывать глобальные значения или Hero. Визуальная унификация конкретных карточек/форм/мобильного конструктора выполняется в RF-03…RF-11, а не повторяется здесь.

**Ограничение проверки:** это статический аудит файлов GitHub. До выполнения тестов и реального browser QA на 320/390/768/1440 нельзя считать адаптивность, контраст и отсутствие обрезки фокуса подтверждёнными. Проверки `npm test`, `npm run typecheck`, `npm run build`, `npm run test:navigation` обязательны для каждого будущего изменения кода; CI после документального коммита подтверждает только текущий pipeline.

История выполнения и QA — в [issue #5](https://github.com/looksawful/rollform-internal/issues/5) и Asana, без дополнительного журнала в README.
