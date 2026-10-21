# Changelog

## [2.0.0-beta.6] - 2026-10-21

### Русский

- Исправлен сброс новых машин: если исходные параметры не сохранены, редактор объясняет причину и не сообщает об успехе.
- Неудавшийся сброс больше не вызывает автоматическую запись в игровые файлы.
- Исправлено восстановление параметров с исходным значением `0`.
- Проверка готовой сборки без открытия окон добавлена в выпуск на GitHub.

### English

- Reset now explains when a new vehicle's original values are unavailable instead of reporting success.
- A failed reset no longer automatically saves the game files.
- Parameters with an original value of `0` can now be reset correctly.
- Added a packaged startup check without opening windows to GitHub releases.

## [2.0.0-beta.5] - 2026-10-21

### Русский

- Добавлено чтение DLC 19: Wortek 250T, Derry Savior и связанных XML.
- Новые изображения загружаются из локального `gfx.pak` после проверки ссылки XML и SHA-256.
- Исправлена перепутанная привязка изображений Mercedes-Benz 3850 и Mercedes Mamute 1519.
- Для сброса параметров DLC 19 сохраняется локальный снимок архива до изменений редактором. Для изменённого архива без привязанного снимка сброс недоступен.
- Добавлены тесты распаковки, сохранности пользовательских изменений и обработки изображений.
- При обновлении игровых данных предыдущая копия извлечённых файлов сохраняется, а не удаляется.

### English

- Added DLC 19: Wortek 250T, Derry Savior and related XML files.
- New images are loaded from the local `gfx.pak` only after XML icon and SHA-256 checks.
- Corrected the swapped Mercedes-Benz 3850 and Mercedes Mamute 1519 images.
- DLC 19 reset values use a local snapshot made before editor modifications. Reset is unavailable for an edited archive without a snapshot bound to its exact hash.
- Added extraction, user-edit preservation and image decoding tests.
- Previous extracted-file backups are preserved when game data is refreshed.

## [2.0.0-beta.4] - 2026-09-05

Двуязычная публичная страница и английские подписи управления.

- README переписан в пользовательском формате на русском и английском языках;
- удалён отдельный раздел для разработчиков из публичного README;
- названия языков в переключателе и подсказки кнопок списка переведены на английский;
- подписи вариантов описания техники заменены на `Russian` и `English`;
- описание приложения в `package.json` теперь содержит русский и английский варианты.

## [2.0.0-beta.3] - 2026-09-03

Двуязычные описания техники.

- добавлена одновременная загрузка игровых локализаций для всех поддерживаемых языков;
- в списке машин отображаются русское и английское описания из `initial.pak`;
- для текущего языка сохранен приоритет текста из модификации;
- карточки техники увеличены по высоте, чтобы описание не перекрывало служебные метки.

## [2.0.0-beta.2] - 2026-09-03

Обновление каталога под текущую установку SnowRunner.

- добавлена поддержка `dlc_18_1`;
- добавлены Mercedes-Benz 3850 и Mercedes Mamute 1519 с XML defaults и изображениями;
- обновлён snapshot до 495 XML и 494 defaults-ключей;
- image manifest синхронизирован с результатом извлечения из `gfx.pak` (`copied=15`, `missing=0`);
- добавлены XML round-trip проверки для обеих новых машин;
- контрольный inventory обновлён по текущему `initial.pak`.

## [2.0.0-beta.1] - Unreleased

Первый тестовый выпуск продолжения проекта.

- добавлена поддержка содержимого актуальных DLC до `dlc_18`;
- добавлены и проверены изображения 13 новых машин из `gfx.pak`;
- исправлен маппинг PCT-страниц старой библиотеки изображений;
- подготовлена миграция на собственный GitHub-репозиторий и канал релизов;
- добавлено уведомление о происхождении проекта и сохранении лицензии upstream.
