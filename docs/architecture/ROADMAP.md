# Дорожная карта развития

## P0 — восстановить воспроизводимость

- подключить локальную копию к upstream в отдельном git-репозитории;
- установить зависимости и сохранить `package-lock.json`;
- зафиксировать Node/npm/Electron toolchain;
- добавить `npm run diagnose` и baseline report;
- не включать новый runtime-код до прохождения `check` и `lint`.

**Готово, когда:** чистая копия устанавливается одной командой, `check` и `lint` проходят, а статус проекта хранится в Git.

## P1 — индекс фактического игрового контента

- заменить hard-coded optimized DLC list на generated list или безопасный fallback;
- добавить `Archive.list`/`Archive.inspect` для чтения состава архива без полного извлечения;
- построить `ContentManifest` по относительным путям и source precedence;
- сохранить game content fingerprint: hash, размер, дата сканирования, версия схемы;
- вынести собственный обход каталогов из `lists` и `addons-content` в один provider.

**Готово, когда:** S17/S18 видны по фактическим XML и не требуют изменения TypeScript-кода.

## P2 — устойчивый XML domain layer

- ввести документ с сохранением неизвестных узлов/атрибутов;
- разделить `raw XML`, `semantic model` и UI descriptors;
- добавить schema registry для truck/trailer/engine/gearbox/suspension/wheel/winch;
- добавить diagnostics: missing reference, duplicate id, unsupported attribute, parse failure;
- заменить огромный defaults-файл на generated snapshot + migration/fallback.

**Готово, когда:** XML любого нового DLC открывается с предупреждением при неизвестном поле, а не падает или теряет данные.

## P3 — UI и пользовательские сценарии

- добавить фильтр source/season/mod и статус diagnostics;
- показывать «raw/advanced» поля, которые parser сохранил, но UI ещё не зарегистрировал;
- обновить изображения лениво из manifest или показывать нейтральный placeholder;
- сделать compare base/DLC/mod и diff перед сохранением;
- расширить export format до `contentFingerprint` и миграций.

**Готово, когда:** пользователь понимает происхождение каждого файла и видит риск перед записью.

## P4 — безопасная запись и release QA

- backup + write-to-temp + re-open + verify + replace;
- отказоустойчивый WinRAR adapter с кодом завершения и логом команд без секретов;
- тесты архива, XML round-trip, precedence, defaults и export/import;
- smoke matrix для base, старого DLC, S17, S18 и mod;
- portable/installer build QA на чистой Windows-машине.

**Готово, когда:** обновление игры не уничтожает пользовательские изменения и ошибка записи оставляет восстанавливаемый backup.
