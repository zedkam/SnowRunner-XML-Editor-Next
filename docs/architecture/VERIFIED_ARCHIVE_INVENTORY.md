# Проверенный inventory `initial.pak`

Архив: `D:\SteamLibrary\steamapps\common\SnowRunner\preload\paks\client\initial.pak`

Проверено: 2026-08-01. Режим: чтение ZIP-оглавления, без распаковки и изменения файла.

Размер архива: 28 847 744 байта. Записей: 11 592.

XML-проверка новых источников: 411 файлов обработаны; 402 прошли строгий
парсер, 9 содержат известные дубликаты атрибутов из retail-архива
(`ColorMultAtDay` или `Quantity`), неожиданных ошибок разбора нет.

## Новые источники контента

| Source id | Записей | Главные XML-сущности |
|---|---:|---|
| `dlc_15_5` | 56 | Freightliner FLD120, Western Star 6900XD, Pacific P16 log trailer |
| `dlc_16` | 89 | `hib_billert_1980`, `plad_440`, `sleiter_st833_chimera` |
| `dlc_16_5` | 73 | `avenhorn_a15`, `padera_std4` |
| `dlc_17` | 63 | `jangsu_rx600`, `voron_g5352`, drill/train trailers |
| `dlc_17_5` | 71 | `mercedes_benz_actros_6x6`, `mercedes_benz_zetros_6x6` |
| `dlc_18` | 59 | `hib_billert_m816`, `mercer_6x6r_230`, three trailers |

Также в архиве присутствуют базовые и региональные источники (`ru_*`, `us_*`, `stuff_01`) и DLC с более ранними номерами.

## Что это меняет

- Старый optimized list действительно не извлекал весь контент после `dlc_15`.
- В optimized list добавлены `dlc_15_5`, `dlc_16`, `dlc_16_5`, `dlc_17`, `dlc_17_5`, `dlc_18`.
- После следующего запуска редактор должен увидеть эти папки в `_dlc`, а списки — получить новые truck/trailer XML.
- Generated baseline для новых XML создан в `src/modules/data/defaults/generated.ts`.
- Для 13 машин ссылки на `TruckImage`/`UiIcon328x458` извлечены; отдельные UI PNG/WebP в retail PAK не найдены, поэтому runtime использует fallback до появления flat-файла.

## Следующий технический срез

1. Распаковать только добавленные источники в временный workspace редактора.
2. Составить manifest всех `classes/{trucks,engines,gearboxes,suspensions,wheels,winches}`.
3. Открыть по одному truck из каждого source id и проверить referenced XML.
4. Проверить generated defaults через reset в UI.
5. Проверить round-trip сохранения и модовый override.
