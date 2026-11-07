# ROLLFORM · лаборатория материалов

Дата: 2026-11-07. Статус: экспериментальная страница без ссылки в навигации, но публично доступная по URL. Noindex не является авторизацией.

## Где смотреть

- GitHub Pages: https://looksawful.github.io/rollform/material-lab/
- Страница: `src/app/material-lab/page.tsx`
- Рендер и селектор: `src/components/MaterialLab.tsx`
- Стили: `src/app/material-lab/material-lab.css`
- Локальный путь на Titan: `A:\AgentWork\scratch\rollform-acrylic-lab-20261107` (отдельная рабочая копия).

## Данные, созданные для прототипа

- 6 скруглённых исходных GLB сохранены без изменения в `public/models`.
- 6 UV-подготовленных версий акрила: `public/models/material-lab/{d4,d6,d8,d10,d12,d20}.glb`.
- 7 геометрий эпоксидной смолы с углублёнными базовыми цифрами: `public/models/epoxy/{d4,d6,d8,d10,d00,d12,d20}.glb`.
- 28 моделей с геометрической гравировкой и отдельной сеткой `GoldInlay` для четырёх гарнитур: `public/models/epoxy-font/{nova-flat,square-antiqua,simply-serif,simply-mono}/*.glb`.
- 9 WebP-карт roughness/normal из CC0 ambientCG (Plastic006/007/008/009, Scratches005): `public/material-lab-textures/`.
- Всего вариантов: 7 форм × 4 цвета × 3 шрифта × 7 акриловых отделок = 588; 7 форм × 3 эпоксидных варианта × 5 вариантов гравировки = 105; итого 693. По процентному D00 используется отдельная геометрия с двузначной нумерацией.

## Откуда материалы и шрифты

- ambientCG: https://ambientcg.com/ , лицензия CC0 https://docs.ambientcg.com/license/
- Nova Flat, Wojciech Kalinowski, SIL OFL 1.1: https://github.com/wmk69/Nova
- Square Antiqua, Wojciech Kalinowski, SIL OFL 1.1: https://github.com/wmk69/Square-Antiqua
- Simply Serif, Wojciech Kalinowski, SIL OFL 1.1: https://github.com/wmk69/Simply-Serif
- Simply Mono, Wojciech Kalinowski, SIL OFL 1.1: https://github.com/wmk69/Simply-Mono
- Исходные TTF не включены в репозиторий и не публикуются через сайт; распространяются только собственные геометрические GLB с контуром чисел. Авторские лицензии действуют в отношении исходных гарнитур.

## Фотографии физических образцов пользователя

Эталон: прозрачная красная D8 из литой эпоксидной смолы, чёрно-красная D20 с золотой гравировкой, общий набор чернильно-красных многогранников. Красный прозрачный тонер EPOXYMASTER и чёрные алкогольные чернила EPOXYMASTER. Приведены в разговоре, не выложены в публичный репозиторий. Выглядеть идентично фото при текущей неоткалиброванной оптике и освещении не обещается.

Референсы шрифтов на фотографиях: Nova Flat, AvQest, Renata CAT, Dihjau Regular, Chrysanthemum Bold, Dystopian Canticle Regular, Simply Serif, Square Antiqua, Simply Mono. В текущем селекторе точно реализованы первые подтверждённые четыре OFL-гарнитуры из этого набора плюс базовая; остальные не воссоздавать заменителями без проверки прав/исходников.

## Технические сведения и границы

- Three.js `MeshPhysicalMaterial`: transmission, IOR ≈1.54 (пример для эпоксидного связующего, точное значение зависит от состава), absorption/thickness, physical clearcoat; процедурный объёмный пигмент и внутренняя геометрия пузырьков. Внутренние элементы упрощены для WebGL.
- В GLB есть TEXCOORD_0. Цифры во многих дополнительных эпоксидных GLB действительно вырезаны геометрически; золотое заполнение отдельной сеткой.
- Недостатки: не гарантирована идентичность производственным STL, поскольку рабочие веб-копии получены из форм сайта, а не напрямую из пользовательских STL; не учтены настоящие оптические пути многократных преломлений, неоднородность пигмента не откалибрована. Цвет поверхности при фото освещении отличается от рендера. Лаборатория является визуальным прототипом, не промышленным чертежом.
- Акриловые рендеры и существующие страницы не переопределены.
- Тесты: `npm test`, `npm run typecheck`, `npm run build`, `node scripts/prototype-acrylic-smoke.mjs`, `npm run test:navigation`. Browser smoke проверяет 390/1440 px, все шесть базовых GLB, все 4 дополнительных гравировки, запросы текстур и формирование shareable URL.
- Страница не указана в шапке, SEO robots noindex; не является закрытой/парольной.

## Генерация и сопровождение

- `python scripts/prototype-acrylic-textures.py`: скачивает CC0 карты.
- `blender -b --python scripts/prototype-acrylic-uv.py`: UV-копии базовых моделей.
- `blender -b --python scripts/prototype-epoxy-models.py`: оригинальные геометрические углубления.
- `python scripts/prototype-font-fetch.py` и `blender -b --python scripts/prototype-epoxy-fonts.py`: создают модели со шрифтовыми гравировками; исходные TTF скачиваются **вне репозитория** в локальный scratch-путь. Эти операции нужны только при регенерации ассетов.
- `scripts/prototype-font-wiring.py`, `scripts/prototype-epoxy-patch.py`, `scripts/prototype-epoxy-polish.py`, `scripts/prototype-url-cleanup.py` — скрипты одноразовых миграций; НЕ нужны для рантайма. Перед релизом можно исключить из коммита во избежание техдолга. Для повторной сборки моделей нужны только исходные три генератора.

## Следующий этап

1. Прямое сопоставление с предоставленными STL, включая ориентацию, истинную глубину гравировки и размеры.
2. Измерение оптики смолы и цвета пигмента по стандартизированным фотографиям / HDRI, затем калибровка WebGL.
3. Проверка прав и получения оставшихся пяти референсных гарнитур, затем генерация новых GLB.
4. Проверить GoldInlay и видимость внутренних элементов на iPhone/Safari; Chromium smoke не заменяет Safari.
