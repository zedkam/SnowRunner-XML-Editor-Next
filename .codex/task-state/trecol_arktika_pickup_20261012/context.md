# Оркестрация: ТРЭКОЛ АРКТИКА Пикап: проектирование и реализация

- task-id: `trecol_arktika_pickup_20261012`
- status: `active`
- phase: `implementation`
- revision: `4`
- branch: `codex/task-state/trecol_arktika_pickup_20261012`
- updated: `2026-10-12T15:30:37Z`
- models: architecture=`gpt-6-astra`, files=`gpt-5.6-terra`, analysis=`gpt-5.6-sol`, summary=`gpt-5.6-luna`

## Цель

Работать по TRECOL_ARKTIKA_PICKUP_PLAN.md до проверенной собственной модели; начать B00-B02 и затем выполнять доступные стадии без выдуманной геометрии. Проектирование строго Astra/max.

## Текущее состояние

User has no CAD or survey access and explicitly requests reconstruction from images. Visible original geometry now proceeds from calibrated factory drawings and photos.

## Следующие действия

- Accept Astra/max D3 source-traced panel/tire recipe, create real visible Mesh in the one connected Blender via root MCP, compare orthographic views and save own working.blend while preserving D1.

## Область

- SnowRunner-Modding/objects/vehicles/trecol_arktika_pickup
- SnowRunner-Modding/docs/TRECOL_ARKTIKA_PICKUP_PLAN.md
- SnowRunner-Modding/work/research/trecol_arktika_pickup_20261011

## Ограничения

- User authorized implementation and orkestr on 2026-10-12; prior information-only scope lifted.
- Design: gpt-6-astra reasoning max, read-only architect duties; Terra edits files; Sol researches; root integrates.
- Only trecol paths; preserve other object edits, game saves and active Blender/Editor sessions.
- No invented geometry, proxy assets, guessed pivots, false Editor/game PASS or factory-reference release.
- LOCAL REVIEW COPY ONLY: automatic approval rejected external state push; origin synchronization remains pending explicit authorization.
- Previous LOCAL REVIEW-only sync restriction superseded by explicit user approval for three metadata files to zedkam/SnowRunner-XML-Editor-Next; models/photos/game resources remain excluded.
- User explicitly authorized closing the current trailer and opening a new TRECOL file in the already connected Blender; do not overwrite trailer canonical; recover unsaved state if it appears.
- USER SUPERSEDES previous CAD prerequisite: photo-derived geometry and later declared simulation estimates are allowed; no proxy assets, false factory precision, donor import or unsupported runtime PASS.
- USER requires one existing Blender GUI session only; never launch additional GUI or background Blender processes. Live inventory confirms only PID78500 with TRECOL and MCP.

## Принятые решения

- Baseline trecol_arktika_pickup_1600_open_v1: open pickup, 1600 tires, two seats+sleeper, deferred optional equipment; CTIS visual details only until proven.
- Astra/max technical decisions accepted as PRELIMINARY D1; B01 partial and B02 UNVERIFIED due absent hardpoints/profile/strokes. No R0 geometry or invented rig.
- Blender D1 uses own CURVE/FONT/EMPTY reference guides and 4 source images; non-exporting, distinct from vehicle meshes. New scene-only file will be opened in same live Blender.
- Astra/max D2 separates passive balance Hinge from native wheel suspension; Axle is visual only. Balance link count, topology, hardpoints and numerical settings remain pending.
- Blender 5.2 libraries.write failed; legacy writer disabled. D1 created in clean factory process, saved directly, then opened in GUI with existing MCP addon.
- Use S02 p14 for macro scale and original profile loops, S01 pickup photos and S08/S09 wheel photos for visible details; every inferred dimension carries source and uncertainty. Unknown simulation fields remain pending until their separate design/test phase.

## Открытые вопросы

- D3 image-based geometry recipe in progress with Astra/max. Hidden topology and later simulation settings require declared estimates and Editor/game evidence, rather than unavailable CAD.

## Выполнено

- Принято текущее состояние работы.
- B00 object folder, passport, provenance, reference manifest and static setup report accepted; JSON 3/3 and reference hashes 8/8 passed.
- Read-only live Blender preflight captured: Blender 5.2.0 LTS, saved quadradem_4_q07 scene with 65 objects and isDirty=false.
- B00 passport; D1 reference workspace; B02 native wheel/body semantic audit and D2 document contract.
- Accepted source audit selected five primary Pickup/wheel views plus rim and bed companions; updated object/brief/measurement tasks for photo-based reconstruction.

## Evidence

- Research SHA256 7bc0a1f8962e68fc102bc6d6b68f78cd9052bea40dfcc1b5e890385d8ebba244; plan SHA256 f9e6b3d722051f75b5a64f767d94f18a8c07fb2b914032ef572b82a3cb330c87 unchanged.
- Original Blender scene fingerprint 6b35fdf65863338caa8f7dc7b6733fe33e4574ea259cf013f161b169e07145e7; no Blender mutations yet.
- Origin state branch initialized from local commit 2daca4d3ff3740fe66b3afe82cf1e7e8a14d8302; ls-tree proved only state.json/context.md/events.jsonl.
- Live D1: one scene, 68 reference objects (47 Curve, 17 Font, 4 Image Empty), no Mesh or Armature. Four image hashes and axle/tire/rim dimension checks PASS.
- New D1 SHA256 297e836f10d48bbfba9423b3bce271956d9a4710bf84fe67de3d7c05459f0c61; original trailer SHA before/after 595e9d7ed78c2ecf53a18d977ffc7cc33c37fbcf44ed74bd84a8b8ba8cd998b3. GUI MCP owner PID78500 verified.
- Local modding Git/LFS checkpoint 7b97b16; no model/research binary pushed remotely. 12 JSON documents parse, 3 Python scripts AST valid, 8 wheel rows retain null physical settings.

## Затронутые файлы

- SnowRunner-Modding/objects/vehicles/trecol_arktika_pickup/object.json
- SnowRunner-Modding/objects/vehicles/trecol_arktika_pickup/30_validation/reports/blender_before_20261012.json
- SnowRunner-Modding/objects/vehicles/trecol_arktika_pickup/DESIGN_RECORD.md
- SnowRunner-Modding/objects/vehicles/trecol_arktika_pickup/10_blender/design/kinematic_contract.json
- SnowRunner-Modding/objects/vehicles/trecol_arktika_pickup/10_blender/scene/trecol_arktika_pickup_d1.blend
- SnowRunner-Modding/objects/vehicles/trecol_arktika_pickup/30_validation/reports/d1_reference_build_report.json
- SnowRunner-Modding/objects/vehicles/trecol_arktika_pickup/10_blender/design/measurement_requests.json
