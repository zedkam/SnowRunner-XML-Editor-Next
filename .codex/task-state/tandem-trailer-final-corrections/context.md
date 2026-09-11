# Оркестрация: Tandem trailer final corrections

- task-id: `tandem-trailer-final-corrections`
- status: `active`
- phase: `validation`
- revision: `19`
- branch: `codex/task-state/tandem-trailer-final-corrections`
- updated: `2026-09-11T09:39:14Z`
- models: architecture=`gpt-6-astra`, files=`gpt-5.6-terra`, analysis=`gpt-5.6-sol`, summary=`gpt-5.6-luna`

## Цель

Implement the approved Stage63 correction plan for trailer_sideboard_tandem, validate one integrated build, and stop only when it is ready for the user's in-game acceptance.

## Текущее состояние

Stage69 installed with verified 46-file backup; actual Editor class-load failed: bone_main_cdt has no cdt. Native shape proof was not a collision-recognition proof. Found collision Model prefix regression s69_cdt_* versus required cdt*. Accepted shape unchanged; file-only corrective patch in progress.

## Следующие действия

- Verify name/owner derivative; reconvert, install bounded correction with backup, then reload both Editor classes. User grants computer use without additional requests; warn before switching windows, no idle screen reservation.

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
- Two drawbar WinchSocket positions now equal InstallSocket (6.066999912;1.039999967;0); negative old-position and duplicate-socket tests pass. Candidate dfbb78445757b640393b1f05dfe3ea408113bb2cb34202ec6dd445b224a2be9f, texture manifest64acf57aa06532000f70a1651518fff1a4803ef993fadcc9c92c9eded5fb0a50, validation3331c6548192bba0d38dac9c058eb2033d158b4a2c6f5bc7c971a397078815ca.
- stage69_loop_triangles_source.json SHA4f7723a008cea97b7c412ea34cbc060295ed2c0a9c528a33fd7046d32de0c122 captured in8seconds from existing Stage67 session; no newMesh/window/selection/model changes.
- File-only FBX patch passed raw-property preservation and fresh corner reparse:1059 parts,622253 triangles,16 bones,71 unchanged CDT.
- Fresh native triangle comparison and immutable 71 collision geometry buffers passed. Actual main Editor load failure captured, no game run.

## Evidence

- stage64 checkpoint PASS; Stage53 SHA256 bbdc049f21f6ec4d67b19cb800d53063dd85c632f5632cbe5fc86f3ec77d2fb5; 126 installed files copied and rehashed.
- Пользователь отклонил рессорную переделку. Ноль совпадающих треугольников не подтверждает сохранность подвески. Точный просмотренный файл и среда проверки не указаны.
- Отправка revision 3 commit c0b5b77bad93c94963c513b9214abac42ace966c в origin подтверждена менеджером состояния; устаревший вопрос о SSH-доступе закрыт. Документация прошла git diff --check, карточка объекта разбирается как JSON.
- Последнее сообщение пользователя: на лонжеронах появились артефакты окраски кузова. Точный файл и первопричина пока не установлены.
- Blender query after load: filepath=Stage53, scene=Scene, objects=2754, dirty=false. SHA256 Stage53=BBDC049F21F6EC4D67B19CB800D53063DD85C632F5632CBE5FC86F3EC77D2FB5. Stage64 сохранён в отдельных файлах и не был удалён.
- Stage67 SHA256 7B0BE1721DA053E0E3FAC82AD232841E95CCE18E5F81F2C10E8E29210D050AC0; stage68/validation.json.
- Independent Blender-Y cylinder endpoint projection: minimum axial mesh overlap 0.019336528m; do not extend approved cylinders.
- Stage64 candidate s55_part_0837 active_render game_atlas displaced implicit source UV for s49_main_frame_local_web_bores; four original texture vectors were unlinked. Exact UV binding correction required; source67 unaffected.
- WIP SHA256 da7616059f19b45118e634ec0b27326c19437176da9687b80488db05255b2b3d; owned rig pose reset to exact identity after QA restoration defect; saved identity error0.0, sourceguardPASS. WIP_NOT_FOR_GAME.
- Build source self-tests passed two Stage68 classes and two user-selected stock references, negative duplicate-attribute/control-speed/trailer-type cases.
- full_pose_verified.json; body_uv_verified.json; sourceguardPASS. front_i_cut_debug.json proves12 disconnected coincident outline segments perIsection ratherthan missinggeometry.
- front_i_closure.json; full_pose_verified.json; front_materials_verified.json; qa/stage69_closeup_qa.json. Fuel cavity source/derivative equality0; diagnostic radial145 BVHmiss requires exact resolution.
- measured_fuel_cylinder.json SHAa7aece474115ff13b1bd21566ea216d08ef32b0551ec2464528e634686acf141; fbx_visual_uv0_binary.json; darkqa_v1 fourrenders show blackair/central; sourcegraphmask defect diagnosed andnewmapsreplaced. Usergameunconfirmed.
- stage69_integrated/stage69_validation.json status=file_contract_passed_not_game_ready. Native firstattempt failed trailing-dot path before meshload. Editor requires Explorer launch in BinEditor; direct launch badcwd caused missingresources, ownfailed process closed.
- stage69_native_validation.json actual55permesh topology differences,71CDT4390faces. Do not call fewertriangles a geometryfailure until exact surfaces/UV checked. Game PCT convert proven only through game ModManager; Editor uses verifiedDDS.
- stage69_validate_native.py is being corrected to verify source polygon coverage rather than arbitrary fan triangle equality; native outputs SHA d81b6efda507a93f54c2ad9745fcb67b4459eaa740dbddeae83d4704da66593e unchanged.
- Main independently tested legal polygon checker on six positive/negative in-memory cases. Actual full checker reports 1494 unproven items; not accepted as loss or as a passing conversion.
- ... ещё 4; см. `state.json`.

## Затронутые файлы

- ... ещё 6; см. `state.json`.
