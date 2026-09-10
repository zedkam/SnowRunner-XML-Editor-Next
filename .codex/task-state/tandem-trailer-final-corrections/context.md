# Оркестрация: Tandem trailer final corrections

- task-id: `tandem-trailer-final-corrections`
- status: `active`
- phase: `implementation`
- revision: `8`
- branch: `codex/task-state/tandem-trailer-final-corrections`
- updated: `2026-09-10T18:40:18Z`
- models: architecture=`gpt-6-astra`, files=`gpt-5.6-terra`, analysis=`gpt-5.6-sol`, summary=`gpt-5.6-luna`

## Цель

Implement the approved Stage63 correction plan for trailer_sideboard_tandem, validate one integrated build, and stop only when it is ready for the user's in-game acceptance.

## Текущее состояние

Full Stage69 unshown derivative contains 1059 exact parts (902 accepted original incl six evaluated curves plus 157 Stage68 suspension parts); accepted Stage67 live scene unchanged. Three scoped workers implement rig/export, materials and XML build. Installed mod unchanged. User supplied exact parking references scout_trailer_offroad_tent and semitrailer_flatbed_5; preserve instant-like-stock acceptance.

## Следующие действия

- Finish measured rig and exact profile/G-neck local corrections; bake/apply unique new-part materials and reuse only world/topology-verified UV; create full candidate FBX/XML and native validation, then Editor and user game acceptance.

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
- Рабочая основа только Stage53. Не перерабатывать Stage64 и не продвигать его геометрию, карты или экспорт.
- Актуальная база Stage67; предыдущие записи о запрете менять рессоры и ожидании нового согласования исторические. Принятый подъём/W-S/скорость0.75 и остальные конструкции не перепроектировать.

## Принятые решения

- Рессорный узел Stage64 отклонён; его геометрию и зависимые карты не использовать как принятую основу экспорта. Файлы сохраняются для сравнения.
- Объединить неподвижное основание и сохранить опоры обеих подвесок. Отдельно устранить наложение рессор. Изменение межосевого расстояния и положения подъёмной рамы требует размерного обоснования.
- Материалы лонжеронов также отклонены: случайная окраска кузова недопустима. Сохранность пикселей вне выбранных областей не доказывает правильность материалов на модели. Точная причина пока не установлена.
- Stage68 объединяется с полной производной Stage67; оригинал Stage67 сохраняется. Текстуры новых креплений обязательны до передачи к игре.
- Stock legs references use _trailer_foot; eliminate self-added motor Tau .5/.4, use supported group Tau .04 and source-derived forces, no manual legs menu; actual game timing unconfirmed.
- Approved G-neck height half means centerline step .24m to .12m, beam interface retained and section thickness preserved; resulting eye/socket moves down .12m relative trailer.

## Открытые вопросы

Нет.

## Выполнено

- Принято текущее состояние работы.
- Captured 126 installed files without modifying the installed mod.
- Обновлены текущий план и карточка объекта: рессоры НЕ ГОТОВЫ, пересборка блока является первым этапом. Геометрия и установленные файлы в этом ходе не изменены.
- Дополнены текущий план и карточка объекта отдельным дефектом материалов рамы. Проверены JSON и git diff --check. Модель, текстуры и установленные файлы не менялись.
- Рабочий Blender возвращён к Stage53; контрольная сумма файла подтверждена. План и object.json фиксируют возврат. JSON разбирается, git diff --check проходит.
- Повторная проверка Stage68:157частей,49поз,18отрицательных XMLтестов,offline_pass=true,installable=false. Живой Blender:Stage67,Scene,3104объекта,dirty=false; новый процесс/переключение не выполнялись.
- Geometry inventory1059 verified; recovery removed only one incomplete owned duplicate-weight clone; sourceguard PASS.

## Evidence

- stage64 checkpoint PASS; Stage53 SHA256 bbdc049f21f6ec4d67b19cb800d53063dd85c632f5632cbe5fc86f3ec77d2fb5; 126 installed files copied and rehashed.
- Пользователь отклонил рессорную переделку. Ноль совпадающих треугольников не подтверждает сохранность подвески. Точный просмотренный файл и среда проверки не указаны.
- Отправка revision 3 commit c0b5b77bad93c94963c513b9214abac42ace966c в origin подтверждена менеджером состояния; устаревший вопрос о SSH-доступе закрыт. Документация прошла git diff --check, карточка объекта разбирается как JSON.
- Последнее сообщение пользователя: на лонжеронах появились артефакты окраски кузова. Точный файл и первопричина пока не установлены.
- Blender query after load: filepath=Stage53, scene=Scene, objects=2754, dirty=false. SHA256 Stage53=BBDC049F21F6EC4D67B19CB800D53063DD85C632F5632CBE5FC86F3EC77D2FB5. Stage64 сохранён в отдельных файлах и не был удалён.
- Stage67 SHA256 7B0BE1721DA053E0E3FAC82AD232841E95CCE18E5F81F2C10E8E29210D050AC0; stage68/validation.json.
- Independent Blender-Y cylinder endpoint projection: minimum axial mesh overlap 0.019336528m; do not extend approved cylinders.
- Stage64 candidate s55_part_0837 active_render game_atlas displaced implicit source UV for s49_main_frame_local_web_bores; four original texture vectors were unlinked. Exact UV binding correction required; source67 unaffected.

## Затронутые файлы

- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/30_validation/sandbox/stage64_integrated_corrections/baseline_manifest.json
- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/30_validation/scripts/stage64_checkpoint.ps1
- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/30_validation/reports/stage63_restore_accepted_controls.md
- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/object.json
- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/10_blender/scene/trailer_sideboard_tandem_stage53_olive_black_palette.blend
