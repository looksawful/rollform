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
| ProductCard: `ProductCard.tsx` | есть | `.product:hover`, action | глобальный outline на ссылке/кнопке | счётчик в корзине, локальное `role=status` / `aria-live` с результатом add | нет | при лимите 99 объявляется максимум; `loading="lazy"` у изображения не является UI loading |
| Price: `.product-price`, `.configure-price`, `.cart-price`, `.cart-total` | есть | не требуется | неинтерактивный | не требуется | не требуется | нет, синхронный расчёт |
| Gallery: `ProductDetail.tsx` (фото/3D/Lightbox; `ProductGallery.tsx` — лента карточек, отдельно) | есть | карточки и миниатюры | глобальный outline | `aria-pressed` у миниатюр, `view` фото/3D | нет | браузерный lazy-load; lightbox на странице товара |
| DiceViewer: `DiceViewer.tsx` | есть | не кнопка | tabindex=0 кроме Hero | auto → manual при взаимодействии | нет | реальные `status: loading/ready/error`, fallback, context lost/restored; `role=status` озвучивается вне Hero |
| CartLine: `.cart-entry` в `CartView.tsx` | есть | quantity/remove | глобальный outline | `aria-live` у количества | `disabled` у плюса при 99 | empty-state для пустой корзины; async loading нет |
| FormField: `ContactContent.tsx` | есть | браузерный | глобальный outline | input/textarea focus | native required | native validation; `role=status` при демо-submit, backend отсутствует |
| Menu: `SiteShell.tsx` (`.nav`, `.mobile-menu`) | есть | ссылки | глобальный outline | `aria-current="page"`, details open | нет | нет |
| Breadcrumbs: `Breadcrumbs.tsx` (`.breadcrumbs`) | есть на внутренних экранах | ссылки с hover | глобальный outline на ссылках | `aria-current="page"` на текущем неинтерактивном пункте; на странице товара есть родитель «Кубики в наличии» | нет | нет; нативный `nav` + `ol`, без собственного состояния |

Важные отличия: Hero `DiceViewer continuous=true` не интерактивен и не попадает в tab order; остальные 3D управляются pointer/стрелками. Карусель может иметь дубли карточек для бесконечной прокрутки, у дубликатов отключён tab order. Нельзя объявлять наличие loading/error для всех компонентов только ради симметрии таблицы.

## 5. Семантический контракт для следующих изменений

1. Интерактивные действия — `button type="button"` (или submit для формы); переходы — `a`/`Link`. Для выбранных вариантов сохранять синхронность `aria-pressed` и `.is-active`; для текущей страницы — `aria-current="page"`.
2. Базовый `:focus-visible` уже установлен в `base.css`: `outline: 2px solid var(--color-focus); outline-offset: 4px`. Сначала проверить, не обрезается ли он `overflow:hidden` у конкретного компонента. Не добавлять второй глобальный outline.
3. `.button` имеет `min-block-size: 3.25rem`, `.quantity button` — 2.75rem, `.pill-list button` — `min-inline-size: 4.5rem`. В каталоге на узких экранах RF-03 использует `.product-grid .product-actions .button { font-size: 0.875rem; min-block-size: 3rem; }` и `.product-add-label`; сам `ProductCard.tsx` теперь показывает форму и цвет из `presets.config`. Это **локальный вариант карточки**, не причина добавлять глобальный токен.
4. `prefers-reduced-motion` уже отключает анимацию кнопок и влияет на карусель/3D; сохранять эти исключения.
5. Статические цены не требуют `aria-live`; динамическое подтверждение корзины уже находится в `ProductCard`. Не плодить одинаковые live-region на каждом уровне.
6. Тексты/данные временные, не дополнять их выдуманными свойствами. Все изменения визуальной системы должны опираться на реальный компонент и тестируемый дефект.

## 6. Контроль RF-01 / RF-02 и передача

**RF-01:** инвентарь реальных владельцев, CSS-контрактов и состояний зафиксирован выше. Отдельные компоненты не создавались.

**RF-02:** существующие токены, `.stack`, `.cluster`, `.wrapper`, `.grid`, `.prose` и общий `:focus-visible` уже присутствуют. Изолированная инвентаризация не выявила необходимости переписывать глобальные значения или Hero. Визуальная унификация конкретных карточек/форм/мобильного конструктора выполняется в RF-03…RF-11, а не повторяется здесь.

**Граница приёмки:** реестр подтверждён чтением исходников и браузерной проверкой восьми маршрутов на 320/390/768/1440. Скриншоты, результаты проверки клавиатурного фокуса, точные команды, проверенная SHA и оставшиеся ограничения хранятся в [Issue №5](https://github.com/looksawful/rollform-internal/issues/5), а не в этом нормативном документе. Это не заменяет проверку визуального обрезания контура, 200% zoom, контраста, реального touch и NVDA/VoiceOver. `npm test`, `npm run typecheck`, `npm run build`, `npm run test:navigation` остаются обязательными после изменений кода.

История выполнения и QA — в [issue #5](https://github.com/looksawful/rollform-internal/issues/5) и Asana, без дополнительного журнала в README.

## 7. Карта экранов и реальные владельцы контрактов

| URL | Владелец экрана / поведение | Общие паттерны, на которые он опирается |
| --- | --- | --- |
| `/` | `src/app/page.tsx`, `Storefront.tsx`, `ProductGallery.tsx`, `ProductCard.tsx`, `DiceViewer.tsx` | Hero (не изменять), section/heading, wrapper, stack, reel, карточка |
| `/catalog/` | `src/app/catalog/page.tsx`, `ProductGallery.tsx`, `ProductCard.tsx` | grid, карточка, ссылка и отдельное действие |
| `/product/` | `src/app/product/page.tsx`, `ProductDetail.tsx` | галерея фото/3D, thumbnails, Lightbox, цена и действие |
| `/configure/` | `src/app/configure/page.tsx`, `Configurator.tsx`, `DiceViewer.tsx` | sidebar, stack, field, cluster, `aria-pressed`; мобильная sticky-сводка выбора/цены/CTA уже реализована RF-06 |
| `/cart/` | `src/app/cart/page.tsx`, `CartView.tsx`, `CartState.tsx` | пустое состояние, строка, количество, итог |
| `/contacts/` | `src/app/contacts/page.tsx`, `ContactContent.tsx` | switcher, prose, label/input/textarea, native validation |
| `/production/` | `src/app/production/page.tsx`, `ProductionInfo.tsx`, `DeliveryInfo.tsx` | split, текст, карта; не принимать за checkout |
| `/terms/` | `src/app/terms/page.tsx` | текстовые группы, ссылки |

**Общая оболочка** всех экранов: `src/components/SiteShell.tsx` (внутренняя `SiteChrome`), включая header, настольную и мобильную навигацию, бейдж корзины, footer, тему и motion-reveal. `src/app/layout.tsx` подключает её. В проекте нет `SiteHeader.tsx` или отдельного `Menu.tsx`; их не нужно искать или создавать ради RF-01.

**Две сущности со словом Gallery не смешивать:** `ProductGallery.tsx` отвечает за сетку/горизонтальную ленту карточек. Фото-миниатюры, выбор `view`, 3D-переключение и Lightbox находятся в `ProductDetail.tsx`. Отдельного универсального UI-компонента `Gallery` нет.

## 8. Точные состояния и источники истины

| Паттерн | Источник значения | Что реально может измениться | Чего нет |
| --- | --- | --- | --- |
| Button | HTML button/Link + `components.css`; обработчик в владельце | CSS hover/active/focus, семантические кнопки/ссылки; вариант чёрный/вторичный | Универсального `Button.tsx`, глобального `isLoading` или отдельного disabled-variant |
| ChoicePill | `configFromParams`, `DiceConfig` и `Configurator.tsx` | `aria-pressed=true` и `is-active` одновременно при выбранных shape/shell/font | Отдельного choice-store, async/loading/error, состояния выбора нескольких вариантов одной группы |
| ProductCard | `presets`, `useCart().items`, `ProductCard.tsx` | переход в детали, локальная форма+цвет из `config`, add/count, `announcement` через `role=status` (max 99 / failed add); у дубликатов ленты `tabIndex=-1` и `aria-hidden` на копии | Реального SKU/API, network loading и native disabled |
| Price | `src/lib/pricing.ts` + `formatPrice` | Синхронные placeholder-цены пресета/конфигурации/итога | Асинхронной стоимости, discount-state, discount token, live-region на статической цене |
| Gallery товара | локальный `view` и `lightboxOpen` в `ProductDetail.tsx` | Выбрана миниатюра (`aria-pressed`), фото или 3D, открыть/закрыть Lightbox | Компонента `Gallery.tsx`, единого network loading или ошибки миниатюры |
| DiceViewer | `config`, `continuous`, WebGL/GLB и `status` в `DiceViewer.tsx` | `loading → ready/error`, fallback с кратким сообщением вне Hero, context lost/restored; анимация через `data-motion` | Глобального loading-store или универсальной Retry; Hero не захватывает фокус |
| CartLine | `CartState`, `orders.ts` и `CartView.tsx` | количество, удаление, disable плюса при 99, полное empty-состояние корзины | Отдельного `CartLine.tsx`, loading после запроса, настоящего checkout |
| FormField | браузерная HTML-validation и `submitted` в `ContactContent.tsx` | required/email validation, фокус, `role=status` «сообщение не отправлено» | `FormField.tsx`, backend, отправки, сохранения ввода или настоящего success |
| Menu | `SiteShell.tsx`, `usePathname`, native `details/summary` | `aria-current=page` у текущего маршрута, `open` мобильного меню, Escape, keyboard focus | Отдельного `Menu.tsx` или JS popup state machine |
| Breadcrumbs | `Breadcrumbs.tsx`, `catalogCrumb`, Next `Link`, текущий маршрут/пресет | `nav[aria-label="Хлебные крошки"]`, нативный список, ссылки на главную/каталог/пресет, текущий `span[aria-current="page"]`; responsive и keyboard проверяются `tests/navigation.browser.mjs` | Отдельного store, диалога, selected-кнопки или асинхронных состояний |

Нельзя по наличию общего CSS `:active` объявлять кнопку «selected». Также `loading="lazy"` у изображения означает стратегию загрузки ресурса, **не видимый UI-state loading**. `disabled` у HTML-ввода лишь поддерживается нативно; он не считается реализованным сценарием до появления соответствующей причины блокировки.

### 8.1 Где именно исправлять повторяющиеся стили

- Визуальные примитивы и смысловые роли: `tokens.css`. Новое значение допустимо только при доказанных минимум двух потребителях. Не копировать семантические цвета или шкалы в `pages.css`.
- Глобальный контур фокуса и reset: `base.css`. У `.product-open:focus-visible` и `.product-detail-photo-trigger:focus-visible` есть намеренные локальные `outline-offset: -2px` из-за overlay/overflow, у `.dice-canvas:focus-visible` `-3px`. Проверять на реальном элементе, прежде чем «унифицировать» эти исключения.
- Базовая кнопка и её варианты, pill, quantity: `components.css`. Минимальная высота `.button` 3.25rem (52 px при 16 px), `.quantity button` 2.75rem (44 px); `.pill-list button` имеет минимальную **ширину** 4.5rem, но это не гарантия высоты 44 px.
- Повторяемые алгоритмы компоновки: `patterns.css`; для интервалов задавать локальные `--stack-space`, `--cluster-gap`, `--grid-min`, а не новый класс, который дублирует flex/grid.
- Локальные варианты реальных экранов: `pages.css`, `sections.css`, `responsive.css`. Не поднимать в глобальную шкалу единственный особый размер Hero/3D.
- Длительности 3D и motion по контексту определены в `sections.css` (например, `--dice-roll-duration`), а не в глобальном `tokens.css`. В RF-02 не заводить новую шкалу motion без повторного фактического применения.

### 8.2 Типографические группы, которые необходимо сохранять

- Базовый текст: 1rem / 1.55; малый интерфейсный текст: 0.875rem / 1.45. Заголовок/лид внутри `.prose` разделяются `--prose-heading-gap` и `--prose-gap`; `.stack` не должна одновременно имитировать текстовые margins.
- Страница: `.page-heading > .page-title` с `--fs-heading`, `--lh-heading`, `--tracking-heading`; отступ после группы находится у `.page-heading`, а не дублируется на каждом H1.
- Секция: `.section-title` использует те же смысловые heading-токены. Hero использует display-токены и отдельные согласованные локальные ограничения, **не** менять его в RF-02.
- Товар: `.product-copy.stack`, заголовок `--fs-title`, цена `.product-price`; локальное уплотнение карточек на узких экранах остаётся владельцем RF-03.
- Корзина: `.cart-entry-copy.stack`, `--fs-title` и `--fs-small`, стоимость `.cart-price`. Не перерабатывать сетку строк корзины в пакете 1.
- Конструктор: `.configure-controls.stack`, `.field.stack`, `.pill-list.cluster`, `.configure-price`; `.configure-mobile-buy` — локальная sticky-сводка выбора/цены/CTA на узких экранах, `.configure-desktop-buy` — исходная десктопная кнопка. Поддержка этих сценариев принадлежит RF-06, не RF-02.
- Контакты: `.contact-form.stack` + `.prose` для вводного заголовка/лида; `label.stack`, `input`, `textarea` остаются нативными, без нового `FormField`.

## 9. Воспроизводимая проверка для последующих исполнителей

Работать в **чистой отдельной копии**. Не использовать и не очищать `A:\Users\awful\Downloads\rollform-dev`. Локальная проверенная независимая копия на Titan в этом цикле: `A:\_rollform_rf01_20261108`; перед новой работой сверить `git remote -v`, `git status --short`, `git fetch origin` и текущий `origin/main`. Источником истины всегда остаётся актуальный main, а не снимок 8 ноября.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:navigation
```

Для smoke опубликованного Pages, **после** успешного deployment, тест также поддерживает `ROLLFORM_TEST_URL=https://looksawful.github.io/rollform/`. В Windows cmd: `set ROLLFORM_TEST_URL=https://looksawful.github.io/rollform/&& npm run test:navigation`; в PowerShell задавать `$env:ROLLFORM_TEST_URL`. Команды локального и публичного теста не считать взаимозаменяемыми.

**Минимальная браузерная матрица для каждого изменившего UI пакета**: 8 маршрутов из `7` × 320/390/768/1440 CSS px, дополнительно 430 px для мобильных карточек; проверять количество H1, общий `document.documentElement.scrollWidth <= clientWidth + 1`, JS-исключения, `:focus-visible` при Tab, целевые подписи и реальные размеры элементов. Для элементов под overlay и `overflow:hidden` отдельно проверить, не обрезается ли outline. Проверять только **применимые** состояния из `8`, не делать 9 искусственных variants на каждый элемент.

Проверка Tab на **первом** интерактивном элементе каждого экрана не заменяет полный keyboard walkthrough. Отдельно пройти путь каталог → товар → конструктор → корзина → контакты, открыть/закрыть меню и Lightbox, проверить `aria-pressed`, предельное количество, `required`, fallback 3D, `prefers-reduced-motion`. Настоящие NVDA/VoiceOver, физический touch, 200% zoom и контраст отдельных узлов нельзя объявлять пройденными по одному headless smoke.

**Материалы доказательства**: commit SHA, конкретные npm exit codes / количество тестов, run ID и jobs GitHub Actions, ссылка на опубликованный Pages, размеры viewport и фактические браузерные наблюдения. Эти *оперативные журналы* фиксируются в существующем [Issue №5](https://github.com/looksawful/rollform-internal/issues/5) и задаче Asana `1220167763227563`; не создавать вторую историю запусков в `DESIGN.md` или `README.md`.

## 10. Разделение ответственности, чтобы другие пакеты не блокировались

| Следующий пакет | Владеет | Что пакет 1 **не** меняет |
| --- | --- | --- |
| RF-03…RF-05 | `ProductCard.tsx`, `ProductGallery.tsx`, `pages.css`, каталог, счётчик и обратная связь | Уже реализованное увеличение шрифта CTA до 14px, локальные параметры пресета и объявление добавления; дополнительные исправления принадлежат владельцу каталога |
| RF-06…RF-07 | `Configurator.tsx`, `DiceViewer.tsx`, fallback и sticky CTA | Уже реализованные мобильная сводка и загрузка/ошибка 3D; их дальнейшая проверка и исправления принадлежат владельцу пакета 3 |
| RF-08…RF-10 | `CartState.tsx`, `CartView.tsx`, `ContactContent.tsx` и бизнес-путь прототипа | Checkout, лимит количества, отправка формы |
| RF-11…RF-14 | Полный путь, доступность, motion, перформанс, заключительная приемка | Не объявлять WCAG/physical-device pass без проверки |

**Известная граница**: некоторые текстовые ссылки и иконки могут иметь область действия меньше 44×44 CSS px; это предмет RF-11 после проверки конкретных целей, не повод вводить универсальный padding у всех `a`. Мобильный CTA каталога теперь 14 px и `min-block-size: 3rem` по RF-03; повторно проверять его на новых версиях `main`. Не скрывать иные кандидаты общей записью «все focus-состояния есть».

Правило завершения: перечитать `AGENTS.md`, `README.md` и затронутые исходники; работать поверх актуального `main`; не применять `force push`; сначала тест/браузер/CI/Pages, только затем «готово» в Issue №5 и Asana. Если изменяется только документация, фиксировать это именно как документальную работу, а не как исправление поведения CSS.
