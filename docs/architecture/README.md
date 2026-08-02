# Архитектура продолжения SnowRunner XML Editor

## Цель

Развивать редактор так, чтобы новый контент SnowRunner подключался данными установленной игры и небольшими адаптерами, а не ручным добавлением номера DLC в несколько несвязанных файлов.

## Правила границ

1. `main` владеет файловой системой, архивами, backup и безопасной записью.
2. `renderer` владеет представлением, таблицами, фильтрами и пользовательскими сценариями.
3. `core/content` владеет идентичностью контента, происхождением, приоритетом и индексом файлов.
4. `core/xml` владеет разбором, изменением и сохранением XML; UI не должен работать с Cheerio напрямую.
5. `application` связывает use case (`scan`, `open`, `edit`, `reset`, `export`, `save`) с адаптерами.
6. `infrastructure` содержит адаптеры WinRAR/архивов, файловой системы, установки игры и persistence.
7. Новый DLC не получает отдельную ветку в parser. Отдельный adapter появляется только если структура XML действительно изменилась.

## Целевая схема

```text
Установка игры
    ↓
Archive Adapter → Extraction Workspace
    ↓
Content Scanner → Content Manifest
    ↓
Source Resolver (mod > dlc > base > backup)
    ↓
XML Domain Model + Schema/Field Registry
    ↓
Application Use Cases
    ↓
Renderer Projection → Vue tables/forms
    ↓
Transactional Save → verify → archive update
```

## Целевое дерево

```text
src/
  architecture/                  # нейтральные контракты и правила миграции
    content/                     # стартовый каркас добавлен в этой итерации
  application/                   # use cases; следующий этап
  core/
    content/                     # manifest, source resolver, entity identity
    xml/                         # document model, preservation, diagnostics
  infrastructure/
    archive/                     # WinRAR/будущий archive adapter
    filesystem/                  # main-process filesystem adapter
    game-install/                # discovery initial.pak и путей DLC
    persistence/                 # config, backups, export migrations
  modules/                       # текущая совместимость и постепенный перенос
  renderer/                      # текущий Vue UI и projections
tests/
  fixtures/                      # обезличенные XML-фрагменты и manifest snapshots
tools/
  diagnostics/                   # read-only проверки состояния проекта
docs/architecture/               # решения, матрица DLC, roadmap
```

## Контентная модель

Каждый файл должен иметь стабильную запись:

```text
ContentFile
  relativePath     [media]/_dlc/dlc_18/classes/trucks/mercer_r230.xml
  source.kind      base | dlc | mod | backup
  source.id        dlc_18 | <mod-id> | base
  entity.kind      truck | trailer | engine | ... | unknown
  entity.id        имя XML без расширения
  precedence       число, вычисленное политикой source resolver
  diagnostics      предупреждения разбора и неизвестные узлы
```

`absolutePath` не должен попадать в экспортируемый пользовательский формат. Для идентификации используются `source.id`, относительный путь и entity id.

## Приоритет источников

Текущая семантика сохраняется: `mod > dlc > base`. Backup открывается явно и не должен незаметно перекрывать рабочий источник. Если несколько DLC содержат один файл, порядок должен быть зафиксирован в manifest (`archive order`/`patch order`), а не зависеть от порядка `readdir`.

## Сохранение XML

- parser обязан сохранять неизвестные элементы, атрибуты и текстовые узлы;
- UI меняет только зарегистрированные поля;
- raw editor используется для нераспознанных участков;
- перед записью выполняются parse → semantic validation → serialize → reparse;
- архив заменяется только после успешной проверки и создания backup.

## Интеграция с текущим кодом

Новая архитектура добавлена рядом с текущими `/modules`, чтобы не ломать рабочий прототип. Миграция идёт вертикальными срезами:

1. `Archive` и `DLCs` начинают отдавать `ContentManifest`.
2. `GameXML.getFile()` использует `SourceResolver`, сохраняя текущий приоритет.
3. Списки и редактор получают entities из manifest, а не выполняют собственный обход каталогов.
4. Reset получает baseline из snapshot/manifest и только потом использует старый `defaults` как fallback.
5. Save получает транзакционный writer и проверку round-trip.

Список задач и критерии готовности: [`ROADMAP.md`](ROADMAP.md).

## Изображения машин из установленной игры

В SnowRunner изображения магазина не являются отдельными PNG. Они лежат в
`preload/paks/client/gfx.pak` как `.pct`, а соответствие
`UiIcon328x458` → texture page хранится в `gfxbundle.gfxbundle` внутри
`trucks_img_lib.gfx`. Скрипты `tools/generation/pct_to_png.py` и
`tools/generation/extract_game_images.py` декодируют эту цепочку и сохраняют
картинки в `src/images/trucks`.

Для legacy-части `trucks_img_lib.gfx` генератор учитывает смещение raster page
на три texture id; поздний блок Season 18 (`i400+`) читается напрямую. Метод
сопоставления записывается в `generated-image-links.json`, чтобы результат можно
было проверить и не подменять картинки по имени файла.

Один раз установить зависимости:

```powershell
python -m pip install -r tools/generation/requirements-images.txt
```

Затем запускать из корня проекта:

```powershell
npm run generate:images -- -GameRoot 'D:\SteamLibrary\steamapps\common\SnowRunner'
```

Команда читает PAK только на чтение, обновляет `generated-image-links.json` и
перегенерирует изображения для DLC, перечисленных в этом манифесте. Перед
релизом нужно визуально проверить новые карточки, особенно при изменении
формата `gfxbundle.gfxbundle`.
