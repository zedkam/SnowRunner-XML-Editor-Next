# Оркестрация: Tandem trailer final corrections

- task-id: `tandem-trailer-final-corrections`
- status: `active`
- phase: `design`
- revision: `22`
- branch: `codex/task-state/tandem-trailer-final-corrections`
- updated: `2026-09-11T13:37:47Z`
- models: architecture=`gpt-6-astra`, files=`gpt-5.6-terra`, analysis=`gpt-5.6-sol`, summary=`gpt-5.6-luna`

## Цель

Implement the approved Stage63 correction plan for trailer_sideboard_tandem, validate one integrated build, and stop only when it is ready for the user's in-game acceptance.

## Текущее состояние

2026-09-11: пользователь отклонил игровой результат Stage69. Обновлён единый план Stage63 с подробным разделом Stage70, сохранены три оригинальных скриншота и переданы двум исполнителям как изображения. Подтверждены пружинные стопы и пробел прежней проверки цилиндров. Высота сцепного элемента окончательно принята. В открытом Blender выбрана существующая полная сцена без сохранения или правок; реализация сейчас не разрешена.

## Следующие действия

- После указания пользователя начать исправления по Stage70: сначала независимая проверка привязок и понятный просмотр, затем цилиндры, две мгновенные позы лап с жёсткими окончаниями, заглушки, форма/плеск топлива и материалы. Обязательная остановка для приёмки полной сцены в Blender ДО мода/Editor/игры.

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
- Do not reserve or control the desktop during file checks. UI session reset after user complaint; warn and establish availability before any next Editor interaction.
- Актуальные полномочия: компьютер разрешён пользователем для необходимых действий без повторных запросов; предупреждать перед UI, освобождать экран при файловой работе. Приёмка в игре остаётся пользовательской. Актуальная база Stage67; старые Stage53-only и plan-only ограничения являются историческими и заменены последующими утверждениями.
- АКТУАЛЬНОЕ УКАЗАНИЕ 2026-09-11 заменяет прежнее продолжение до игры: текущий ход только анализ, план и выбор существующей сцены. Разрешение пользоваться компьютером не разрешает реализацию. Следующая приёмка сначала в Blender, до переноса исправлений в мод, Editor или игру.

## Принятые решения

- Рессорный узел Stage64 отклонён; его геометрию и зависимые карты не использовать как принятую основу экспорта. Файлы сохраняются для сравнения.
- Объединить неподвижное основание и сохранить опоры обеих подвесок. Отдельно устранить наложение рессор. Изменение межосевого расстояния и положения подъёмной рамы требует размерного обоснования.
- Материалы лонжеронов также отклонены: случайная окраска кузова недопустима. Сохранность пикселей вне выбранных областей не доказывает правильность материалов на модели. Точная причина пока не установлена.
- Stage68 объединяется с полной производной Stage67; оригинал Stage67 сохраняется. Текстуры новых креплений обязательны до передачи к игре.
- Stock legs references use _trailer_foot; eliminate self-added motor Tau .5/.4, use supported group Tau .04 and source-derived forces, no manual legs menu; actual game timing unconfirmed.
- Approved G-neck height half means centerline step .24m to .12m, beam interface retained and section thickness preserved; resulting eye/socket moves down .12m relative trailer.
- Front extension actual end faces are full rectangles170.11x295.266mm; naive rectangular extrusion would repeat rejected block appearance. Do not execute old local_fixes until true channel/profile continuation is implemented from source measurements.
- New162 maps are owned unaccepted generated assets and may be versioned/rebaked for aged black. Preserve old896/body/tank/toolbox and accepted Stage67 geometry.
- Currentnew162 blackbase is correct, minorproceduralage required for agreedstyle; onlyalbedo changes, acceptednormal/shading andold896body retained. Existing Stage67 remainsacceptedsource, no newgameclasses.
- Use explicit authoritative Blender loop triangles on disposable export UV copies only; preserve controlpoint positions, UV0, split normals, weights, material slots and1059names. Keep original n-gon FBX/candidate, do not rebuild accepted hardware or use builder --replace.
- SUPERSEDES disposable Blender-mesh triangulation route: do NOT call unused export_triangulated_fbx helper (review caught weights/normal risks before any execution). Use stage69_patch_fbx_triangles.py on preserved oldFBX plus authoritative loop dump; write a separate new FBX. Modify only polygon/loop index references, per-polygon smoothing/material indices and derived Edges.
- Replace ambiguous n-gon export only using measured Blender loop triangles; no redesign, new scene, desktop control, installed writes or invented native proof.
- Fix only FBX collision Model names to cdt69001..071 and two axle-hull ownerships to actual main Body with world coordinates preserved. Do not change CombineXMesh Type, accepted visuals, UVs, materials or active Blender scene. Add semantic collision-ownership guard.
- Do not treat old render-stream CDT geometry classification as engine physics recognition. Actual class loading in Editor is mandatory after bounded repair; no game acceptance yet.
- Игровая приёмка выполняется пользователем. Мгновенность лап, работа цилиндров под нагрузкой, поперечное поведение колёс и плеск топлива пока не подтверждены игрой. Не объявлять выпуск или игровую готовность.
- Финальная высота сцепного элемента Stage69 принята пользователем; проушину, положение сцепки, W/S скорость0.75 и принятую подвеску Stage67 больше не менять. Прежнее решение о правильности почти сплошного чёрного нового материала отменено пользовательской игровой проверкой.
- Бывший cylinder PASS проверял заданные Blender matrices, а не реальный AutomaticIK. В XML стопы имеют Hinge +-12deg и Spring120/Damping35; это не жёсткие окончания. Факт успешной загрузки Editor не является приёмкой этих требований.

## Открытые вопросы

- Подтвердить буквальное мгновенное переключение вида и столкновений лап; не подменять ускоренным физическим переходом.
- Установить реальное соответствие FBX/native/XML привязок цилиндров, конкретного торца на скриншоте2 и способ формы топлива по оболочке бака. Эти неизвестные не закрывать формальными PASS.

## Выполнено

- Принято текущее состояние работы.
- Captured 126 installed files without modifying the installed mod.
- Обновлены текущий план и карточка объекта: рессоры НЕ ГОТОВЫ, пересборка блока является первым этапом. Геометрия и установленные файлы в этом ходе не изменены.
- Дополнены текущий план и карточка объекта отдельным дефектом материалов рамы. Проверены JSON и git diff --check. Модель, текстуры и установленные файлы не менялись.
- Рабочий Blender возвращён к Stage53; контрольная сумма файла подтверждена. План и object.json фиксируют возврат. JSON разбирается, git diff --check проходит.
- Повторная проверка Stage68:157частей,49поз,18отрицательных XMLтестов,offline_pass=true,installable=false. Живой Blender:Stage67,Scene,3104объекта,dirty=false; новый процесс/переключение не выполнялись.
- Geometry inventory1059 verified; recovery removed only one incomplete owned duplicate-weight clone; sourceguard PASS.
- Three 2048px material maps baked; all159 UV target rectangles nonblank; air reservoirs dark aged frame metal. WIP derivative saved independently.
- Actual16bone standing/stowed and min/neutral/max cylinder LBS PASS; pose basis restored. Exactbody5955tri UV applied withfour accepted maps, no rebake.
- Exactreuse896 finalized; true Iprofile front closure with482new/2252preserved faces; CDT71 and fullpose verified. Six offline QA images reviewed, new lightgray supports/air rejected, not game ready.
- Geometryoutput752f29f5b2216d0b05a52cfc92122e80dd8fc0a680b0adf99ec2e7752dabd850 produced fromactualstate andtwoexistingclassFBX. Actualsource-derivedfuelCylinderLength1.139999986 RadiusY.206999873 RadiusZ.246999949.
- Full blend saved b0a5234b6b7035138833e26215fcdfd2ac56ad0fb6b2f315cc14c395693d12db; source67 preserved. Full FBX2626f0474f22b70870758bd3fba32d62cb9022eff94160709914ad0dcc04e3df, 16bones71CDT1059visuals.
- Texture native manifest aa81285e7bc6c96e558d80efb19d7f2c8b4cb0fac318a30ba1e632ac5a13f4c5; both mesh logs empty/noerrors; preparation remains non-runtime.
- Read-only first-stream forensics: 0043 has 1112 nonzero triangles in both FBX and native, area delta 2.9e-16 m2, zero unmapped position/UV corners; 16 zero-area triangles removed.
- Two drawbar WinchSocket positions now equal InstallSocket (6.066999912;1.039999967;0); negative old-position and duplicate-socket tests pass. Candidate dfbb78445757b640393b1f05dfe3ea408113bb2cb34202ec6dd445b224a2be9f, texture manifest64acf57aa06532000f70a1651518fff1a4803ef993fadcc9c92c9eded5fb0a50, validation3331c6548192bba0d38dac9c058eb2033d158b4a2c6f5bc7c971a397078815ca.
- stage69_loop_triangles_source.json SHA4f7723a008cea97b7c412ea34cbc060295ed2c0a9c528a33fd7046d32de0c122 captured in8seconds from existing Stage67 session; no newMesh/window/selection/model changes.
- File-only FBX patch passed raw-property preservation and fresh corner reparse:1059 parts,622253 triangles,16 bones,71 unchanged CDT.
- Fresh native triangle comparison and immutable 71 collision geometry buffers passed. Actual main Editor load failure captured, no game run.
- Actual corrected FBX SHA256 3b7c4c4cde3bfb198f87be5c06ed9dc02bfc7c70793c7f1958c6c2cd4bc39f10: 71 cdt-prefixed Models, declared Body ownership, identical world hull hashes. Only two pinned FBX inputs changed; XML and 19 TGA unchanged.
- Строгие XML и round-trip проверки, сохранность 1059 видимых сеток и 622253 треугольников подтверждены. Отдельное исправление четырёх файлов установлено с резервом; после Editor их хеши верны, остальные 42 файла установки не изменены.
- Stage70 план и реестр изображений записаны; объект и исторический handoff обновлены. JSON разобран, ссылки плана существуют, git diff --check без ошибок. Stage67 SHA256 не изменился.

## Evidence

- stage64 checkpoint PASS; Stage53 SHA256 bbdc049f21f6ec4d67b19cb800d53063dd85c632f5632cbe5fc86f3ec77d2fb5; 126 installed files copied and rehashed.
- Пользователь отклонил рессорную переделку. Ноль совпадающих треугольников не подтверждает сохранность подвески. Точный просмотренный файл и среда проверки не указаны.
- Отправка revision 3 commit c0b5b77bad93c94963c513b9214abac42ace966c в origin подтверждена менеджером состояния; устаревший вопрос о SSH-доступе закрыт. Документация прошла git diff --check, карточка объекта разбирается как JSON.
- Последнее сообщение пользователя: на лонжеронах появились артефакты окраски кузова. Точный файл и первопричина пока не установлены.
- ... ещё 23; см. `state.json`.
