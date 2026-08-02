# План продолжения и публикации проекта

Целевой репозиторий создан и подтверждён: публичный
`https://github.com/zedkam/SnowRunner-XML-Editor-Next`. Локальная публикация
истории выполняется после безопасной авторизации GitHub на рабочей машине.

## Рекомендуемая идентичность

- название приложения: `SnowRunner XML Editor Next`;
- display name: `SnowRunner XML Editor Next`;
- внутреннее имя процесса/инсталлятора на первом этапе можно сохранить
  `SnowRunnerXMLEditor`, чтобы не ломать обновление и пользовательские данные;
- владелец и имя репозитория: `zedkam/SnowRunner-XML-Editor-Next`;
- рекомендуемая первая тестовая версия: `2.0.0-beta.1`;
- первый стабильный релиз продолжения: `2.0.0`.

## Что должно появиться в новом репозитории

```text
README.md                         описание продолжения и установка
README.EN.md                      английская версия
UPSTREAM_NOTICE.md                происхождение, лицензия и границы проекта
CHANGELOG.md                      история версий продолжения
CONTRIBUTING.md                   правила разработки и проверки
SECURITY.md                       порядок сообщения об уязвимостях
docs/architecture/                архитектура DLC, изображений и релизов
.github/workflows/ci.yml          check, lint, тесты, сборка без публикации
.github/workflows/release.yml     tag -> Windows installer/portable/checksums
```

История исходного проекта должна быть сохранена через импорт/зеркалирование, а
не через публикацию папки без `.git`. В локальном checkout нужно настроить два
remote: `origin` — новый репозиторий продолжения, `upstream` — исходный проект.

## Версионность

Используется SemVer:

- `MAJOR` — несовместимое изменение формата экспорта, конфигурации или запуска;
- `MINOR` — новые DLC, поля, функции и совместимые изменения;
- `PATCH` — исправления без изменения контрактов;
- `-beta.N` — тестовые сборки до стабильного релиза.

Версия должна быть одной и той же в `package.json`, `package-lock.json`,
`src/consts.ts`, Inno Setup и Git tag. Релизный workflow должен проверять это до
публикации.

## Релизы и обновления

Новый канал не должен зависеть от старого `verzsut.github.io/sxmle_updater`.
Рабочая схема:

1. push тега `v2.0.0`;
2. GitHub Actions запускает `npm ci`, `npm run check`, DLC/image validation и
   Windows packaging;
3. workflow создаёт GitHub Release и прикладывает installer, portable EXE и
   `SHA256SUMS.txt`;
4. приложение читает публичный `releases/latest` API нового репозитория;
5. из `tag_name` определяется версия через нормальный SemVer-парсер;
6. приложение скачивает выбранный asset, проверяет HTTP-ответ, размер и SHA-256,
   после чего передаёт установку Windows installer или показывает portable-файл;
7. для beta-канала используется отдельная настройка `includePrerelease`.

Runtime-приложению не нужен личный GitHub token для публичных релизов. Для
Actions используется встроенный `GITHUB_TOKEN`; персональный ключ не должен
попадать в исходники, README, workflow или переписку.

## Порядок миграции

1. создать локальный `.git`, сохранить исходную историю и добавить `upstream`;
2. заменить старые ссылки GitHub/Pages в runtime, `docs/script.js` и меню;
3. добавить CI, release workflow, checksums и release notes;
4. реализовать GitHub Releases updater с совместимостью настроек;
5. собрать `2.0.0-beta.1`, проверить установщик, portable и обновление;
6. опубликовать историю в `zedkam/SnowRunner-XML-Editor-Next`;
7. после smoke-теста выпустить стабильный `v2.0.0`.

## Что потребуется от владельца проекта

- подтверждение локальной авторизации GitHub; токен не добавляется в проект и
  не пересылается в чат;
- доступ к GitHub CLI `gh` или Git Credential Manager для push с сохранённой
  upstream-историей.
