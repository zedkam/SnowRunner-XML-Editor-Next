# XML fixtures

Fixtures должны быть маленькими, обезличенными и покрывать один поведенческий риск. Не добавляйте сюда полный `initial.pak` или коммерческие бинарные assets.

Минимальный набор для content-driven миграции:

- `base/` — базовый truck/trailer и связанные файлы;
- `dlc-17/` — representative Season 17 content;
- `dlc-18/` — representative Season 18 content;
- `mod/` — override одного файла;
- `templates/` — `_templates` и `Include`;
- `invalid/` — diagnostics, но не crash.

Каждый fixture сопровождается manifest snapshot и round-trip expectation: какие значения изменились и какие узлы должны остаться байт/семантически эквивалентными.
