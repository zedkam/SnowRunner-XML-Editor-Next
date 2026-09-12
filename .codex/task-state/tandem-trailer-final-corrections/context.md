# Оркестрация: Tandem trailer final corrections

- task-id: `tandem-trailer-final-corrections`
- status: `active`
- phase: `implementation`
- revision: `33`
- branch: `codex/task-state/tandem-trailer-final-corrections`
- updated: `2026-09-12T10:31:12Z`
- models: architecture=`gpt-6-astra`, files=`gpt-5.6-terra`, analysis=`gpt-5.6-sol`, summary=`gpt-5.6-luna`

## Цель

Implement the approved Stage63 correction plan for trailer_sideboard_tandem, validate one integrated build, and stop only when it is ready for the user's in-game acceptance.

## Текущее состояние

Stage74: Box XML проверен. Fresh binding audit42negativePASS; main применил16bone root +71CDT names и2axle-owner compensation, world/geometry/skin preserved. Faithful material helper проходит actual UV correction до native bake; игра и installed не тронуты.

## Следующие действия

- По Stage74 checkpoint завершить material pilot/full153 transfer, final FBX triangle/native preparation и независимые проверки. Принятый Stage72 вид не менять; без игры.

## Область

- SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem

## Ограничения

- Preserve approved hitch architecture, W/S control and SpeedMult 0.75; do not invent replacement mechanisms or new game classes.
- Fix the complete planned set before user gameplay acceptance. Latest instruction cancels the brief reference-game diagnostic permission: compare stock settings in XML only, do not launch or control SnowRunner now.
- Landing legs have only instant attached/detached states and no manual menu controls.
- Materials are revised only after structural elements are accepted; brake reservoirs must be aged black steel.
- Warn the user before controlling Blender, SnowRunner Editor, or game windows.
- Do not touch unrelated objects or publish/release before Editor and user game acceptance.
- Принятая рабочая сцена Stage72; исходная симметричная подвеска Stage67, 80мм общего раздвижения осей и все принятые элементы защищены. Старые Stage53-only, plan-only и запреты прежних исторических этапов заменены последующими утверждениями пользователя.
- Компьютер разрешён для необходимых действий без повторных общих запросов; предупреждать перед UI. При файловой работе не занимать экран. Не открывать другой Blender/версию и не перезаписывать принятую сцену.
- Согласованные файловые и Blender-работы разрешены, Stage72 внешняя приёмка получена. Не требовать её повторно. Выход за план, новая палитра/износ, изменение принятой геометрии и приближение формы топлива требуют отдельного согласия.
- Все исполнители текущего прохода используют gpt-6-astra/max по прямому указанию пользователя, это приоритетнее модельных маршрутов навыка. Main единственный Blender/UI интегратор; исполнители только в раздельных файловых областях.
- Final eye height and position, Stage67 suspension geometry, wheel positions and W/S SpeedMult .75 protected. No arbitrary recoloring or source image changes.
- Never rerun the old Stage69 builder over Stage71. It lacks these edits and would reintroduce old IK axis constants. Include two new endplates explicitly in eventual export; keep existing preview wheels excluded; new web NormalMap basis needs scoped export bake.
- After EVERY context compaction reread stage73_current_checkpoint.md, Stage70 plan, current object.json and task context before actions; preserve accepted work.
- После каждого сжатия перечитать актуальные plan/checkpoint/object/context; старые завершённые builders не запускать. Текущая игровая готовность false.
- Stage74: проверка без игры; внешний вид Stage72 принят и защищён. Исправлять реальные отклонения костей и элементов плана, не повторять старые builders.

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
- Неподходящая старая маска кромок отключена только на новых или перестроенных деталях. Новая палитра, изображения или shader graph не создавались; индивидуальное запекание кромок и игровые карты остаются позже после приёмки конструкции.
- User explicitly requested all three subagents gpt-6-astra reasoning_effort=max; main remains sole Blender MCP integrator.
- All three requested Astra/max agents finished; main applied all Blender writes and inspected each of 8 actual viewport images. Final eye position, suspension/rail/body geometry and weights preserved, no original objects removed.
- Latest user photo overrides prior self-QA of right seam. Only right seam and former-reflector surface are open visual corrections; no redesign or unrelated material changes.
- Right seam caused by isolated old outer weld: removed23faces28vertices only, four remaining weld components intact. Former-reflector repair limited to native material color/roughness ROI106x38; originalmaps/UV and current reflectors unchanged.
- Последнее прямое указание пользователя Astra/max применено ко всем трём исполнителям вместо профилей ролей; ограниченные подзадачи завершены, исполнители закрыты.
- Stage72 visual corrections accepted by user; do not ask reacceptance or reapply. Generic continue does not approve approximate fuel.
- Stage72 strict-merge manifest unimplemented and not user-selected; evaluate minimal Fixed feet preserving10bodies/massCOM/CDT before changing physical ownership.
- Two Fixed foot constraints accepted only as statically tested candidate;10bodies/masses/COM/CDT preserved. This is not infinite Havok rigidity or instant switching PASS.
- Latest user revoked reference-game diagnostics: XML only. One attempted game UI launch was denied; no bypass or permission change. Stage72 visual gate accepted; do not reapply old builders.
- НОВОЕ решение Stage74 отменяет старый запрет Box: пользователь прямо утвердил LimitedFluid Box как у ANK MK38 для одного нашего бака, 180л, native slosh. Внешний бак не менять.

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
- Three 2048px material maps baked; all159 UV target rectangles nonblank; air reservoirs dark aged frame metal. WIP derivative saved independently.
- Actual16bone standing/stowed and min/neutral/max cylinder LBS PASS; pose basis restored. Exactbody5955tri UV applied withfour accepted maps, no rebake.
- Exactreuse896 finalized; true Iprofile front closure with482new/2252preserved faces; CDT71 and fullpose verified. Six offline QA images reviewed, new lightgray supports/air rejected, not game ready.
- Geometryoutput752f29f5b2216d0b05a52cfc92122e80dd8fc0a680b0adf99ec2e7752dabd850 produced fromactualstate andtwoexistingclassFBX. Actualsource-derivedfuelCylinderLength1.139999986 RadiusY.206999873 RadiusZ.246999949.
- Full blend saved b0a5234b6b7035138833e26215fcdfd2ac56ad0fb6b2f315cc14c395693d12db; source67 preserved. Full FBX2626f0474f22b70870758bd3fba32d62cb9022eff94160709914ad0dcc04e3df, 16bones71CDT1059visuals.
- Texture native manifest aa81285e7bc6c96e558d80efb19d7f2c8b4cb0fac318a30ba1e632ac5a13f4c5; both mesh logs empty/noerrors; preparation remains non-runtime.
- Read-only first-stream forensics: 0043 has 1112 nonzero triangles in both FBX and native, area delta 2.9e-16 m2, zero unmapped position/UV corners; 16 zero-area triangles removed.
- ... ещё 19; см. `state.json`.

## Evidence

- stage64 checkpoint PASS; Stage53 SHA256 bbdc049f21f6ec4d67b19cb800d53063dd85c632f5632cbe5fc86f3ec77d2fb5; 126 installed files copied and rehashed.
- ... ещё 37; см. `state.json`.

## Затронутые файлы

- ... ещё 19; см. `state.json`.
