# Матрица поддержки DLC

Дата среза: 2026-09-03. Проверен установленный архив
`D:\SteamLibrary\steamapps\common\SnowRunner\preload\paks\client\initial.pak`
в режиме чтения; файлы игры не изменялись и не копировались в репозиторий.

## Фактически найденный контент

| Source id | Содержимое по XML | Записей в архиве | Статус |
|---|---|---|---|
| `dlc_15_5` | Freightliner FLD120, Western Star 6900XD, Pacific P16 log trailer | 56 | Extraction + generated defaults; image links recorded; UI smoke test pending |
| `dlc_16` | HIB Billert 1980, PLAD 440, Sleiter ST833 Chimera | 89 | Extraction + generated defaults; image links recorded; UI smoke test pending |
| `dlc_16_5` | Avenhorn A15, Padera STD-4 | 74 | Extraction + generated defaults; image links recorded; UI smoke test pending |
| `dlc_17` | Jangsu RX600, Voron G-5352, drill/train trailers | 63 | Extraction + generated defaults; image links recorded; UI smoke test pending |
| `dlc_17_5` | Mercedes-Benz Actros 6x6, Mercedes-Benz Zetros 6x6 | 76 | Extraction + generated defaults; image links recorded; UI smoke test pending |
| `dlc_18` | HIB Billert M816, Mercer 6x6R 230, Gooseneck/steam turbine trailers | 59 | Extraction + generated defaults; image links recorded; UI smoke test pending |
| `dlc_18_1` | Mercedes-Benz 3850, Mercedes Mamute 1519 | 78 | Extraction + generated defaults; image links extracted from current `gfx.pak`; UI smoke test pending |

Нельзя выводить внутренний source id только из названия сезона. При первом запуске
сканер должен сохранить фактические имена папок `_dlc`, а UI может отдельно
показывать человекочитаемый label.

## Что уже можно использовать

- `src/modules/dlcs/main.ts` уже сканирует папки в распакованном `_dlc`.
- `src/modules/xml/game/game-xml.ts` уже умеет искать файл с приоритетом мод → DLC → base.
- полный `unpack-list.lst` запрашивает `[media]\\_dlc`, поэтому является безопасным fallback для проверки новых DLC.

## Что нельзя считать поддержкой

- наличие только номера в `unpack-list-optimized.lst`;
- запись в `defaults/renderer.ts` без реального XML round-trip;
- картинка в `src/images`, если файл не появляется в списке контента;
- успешный parse одного truck XML без проверки связанных engines, gearboxes, suspensions, wheels, winches, templates и strings.

## Контур проверки для каждого нового DLC

1. Получить `initial.pak` после обновления игры и вычислить hash/размер.
2. Извлечь полный `_dlc`, `[media]/classes`, `_templates` и strings в отдельный workspace.
3. Построить manifest с source id и относительными путями.
4. Проверить минимум один truck, один trailer/add-on и все связанные referenced XML.
5. Открыть в UI, изменить один числовой и один строковый/булевый параметр.
6. Сохранить во временный архив, распаковать повторно и сравнить semantic snapshot.
7. Проверить старый DLC, мод и базовый truck, чтобы исключить регрессию при изменении precedence.

## Официальные источники контента

- [Patch notes 40 — Season 17](https://community.focus-entmt.com/focus-entertainment/snowrunner/blogs/338-patch-notes-40-season-17)
- [Patch notes 42 — Season 18](https://community.focus-entmt.com/focus-entertainment/snowrunner/blogs/414-patch-notes-42-season-18)
- [Season 18 announcement](https://community.focus-entmt.com/focus-entertainment/snowrunner/blogs/415-snowrunner-s-season-18-patch-power-is-here)
- [SnowRunner DLC list in Steam](https://store.steampowered.com/dlc/1465360/SnowRunner/?l=russian)

Источники подтверждают содержимое и даты релизов, но не заменяют проверку локального архива: внутриигровые пути и source ids нужно брать из `initial.pak`.
