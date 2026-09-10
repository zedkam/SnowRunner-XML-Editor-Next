# Оркестрация: Tandem trailer final corrections

- task-id: `tandem-trailer-final-corrections`
- status: `active`
- phase: `design`
- revision: `5`
- branch: `codex/task-state/tandem-trailer-final-corrections`
- updated: `2026-09-10T12:34:20Z`
- models: architecture=`gpt-6-astra`, files=`gpt-5.6-terra`, analysis=`gpt-5.6-sol`, summary=`gpt-5.6-luna`

## Цель

Implement the approved Stage63 correction plan for trailer_sideboard_tandem, validate one integrated build, and stop only when it is ready for the user's in-game acceptance.

## Текущее состояние

Рессорная переделка Stage64 и материалы лонжеронов НЕ ГОТОВЫ. Пользователь отклонил потерю частей подвески, сохранившееся наложение рессор и появление окраски кузова на лонжеронах. Прежние выводы о готовности узла и сохранности материалов отозваны. На текущем ходе обновлены только план, object.json и состояние задачи. Моделирование, запекание и сборка приостановлены по запросу сначала повторить понимание.

## Следующие действия

- После согласования понимания восстановить обе полные подвески и пересобрать общее неподвижное основание, сохраняя рессоры и тяги внутри каждого модуля. Измерить необходимость изменения межосевого расстояния и положения подъёмной рамы. Отдельно установить причину окраски кузова на лонжеронах через сравнение материалов, UV, источников запекания и карт с принятым исходником. Только затем исправлять и проверять полный пакет.

## Область

- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem

## Ограничения

- Preserve approved hitch architecture, W/S control and SpeedMult 0.75; do not invent replacement mechanisms or new game classes.
- Fix the complete planned set before gameplay testing; do not use partial in-game trials as design exploration.
- Landing legs have only instant attached/detached states and no manual menu controls.
- Materials are revised only after structural elements are accepted; brake reservoirs must be aged black steel.
- Warn the user before controlling Blender, SnowRunner Editor, or game windows.
- Do not touch unrelated objects or publish/release before Editor and user game acceptance.
- Последняя коррекция пользователя: этот ход только повторение задачи и обновление документации; не продолжать моделирование, запекание или сборку.
- Не удалять функциональные части подвески и не менять форму, длину и взаимное расположение рессор и тяг внутри модуля. Возможный продольный перенос рассматривать целым модулем, не изменяя колею.

## Принятые решения

- Рессорный узел Stage64 отклонён; его геометрию и зависимые карты не использовать как принятую основу экспорта. Файлы сохраняются для сравнения.
- Объединить неподвижное основание и сохранить опоры обеих подвесок. Отдельно устранить наложение рессор. Изменение межосевого расстояния и положения подъёмной рамы требует размерного обоснования.
- Материалы лонжеронов также отклонены: случайная окраска кузова недопустима. Сохранность пикселей вне выбранных областей не доказывает правильность материалов на модели. Точная причина пока не установлена.

## Открытые вопросы

Нет.

## Выполнено

- Принято текущее состояние работы.
- Captured 126 installed files without modifying the installed mod.
- Обновлены текущий план и карточка объекта: рессоры НЕ ГОТОВЫ, пересборка блока является первым этапом. Геометрия и установленные файлы в этом ходе не изменены.
- Дополнены текущий план и карточка объекта отдельным дефектом материалов рамы. Проверены JSON и git diff --check. Модель, текстуры и установленные файлы не менялись.

## Evidence

- stage64 checkpoint PASS; Stage53 SHA256 bbdc049f21f6ec4d67b19cb800d53063dd85c632f5632cbe5fc86f3ec77d2fb5; 126 installed files copied and rehashed.
- Пользователь отклонил рессорную переделку. Ноль совпадающих треугольников не подтверждает сохранность подвески. Точный просмотренный файл и среда проверки не указаны.
- Отправка revision 3 commit c0b5b77bad93c94963c513b9214abac42ace966c в origin подтверждена менеджером состояния; устаревший вопрос о SSH-доступе закрыт. Документация прошла git diff --check, карточка объекта разбирается как JSON.
- Последнее сообщение пользователя: на лонжеронах появились артефакты окраски кузова. Точный файл и первопричина пока не установлены.

## Затронутые файлы

- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/30_validation/sandbox/stage64_integrated_corrections/baseline_manifest.json
- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/30_validation/scripts/stage64_checkpoint.ps1
- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/30_validation/reports/stage63_restore_accepted_controls.md
- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/object.json
