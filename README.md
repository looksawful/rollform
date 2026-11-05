# ROLLFORM

Демонстрационный прототип кубиков: https://looksawful.github.io/rollform/

Это не действующий магазин: наличие, характеристики и сроки не подтверждены; оплата и отправка заказов не работают.

## Запуск

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

## Структура и публикация

- Маршруты: `/`, `/catalog/`, `/configure/`, `/cart/`, `/contacts/`, `/production/`. У каждого есть вариант `/dark/`; компоненты общие.
- `main` — исходный код; GitHub Actions собирает и публикует `gh-pages`. `gh-pages` вручную не редактировать.
- Эксперименты — в отдельной ветке по запросу; в `main` только согласованные изменения.

Решения, замечания и результаты проверок: [единый Issue #5](https://github.com/looksawful/rollform-internal/issues/5) и связанная задача Asana. Исследовательские журналы в репозитории не ведём.

Лицензия проекта: [LICENSE](LICENSE). Иконки: [Lucide](https://lucide.dev/license) (ISC).
