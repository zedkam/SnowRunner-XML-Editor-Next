# Администрирование ручной оркестрации Codex

Руководство относится к рабочему пространству `C:\Users\akoly\Documents\SnowrunnerXML`. Корневой `AGENTS.md`, исходные игровые ресурсы и существующий `.codex/blender-mcp` не входят в управляемый набор.

## 1. Подключение ветки

Git carrier:

```powershell
$workspace = 'C:\Users\akoly\Documents\SnowrunnerXML'
$repo = Join-Path $workspace 'SnowRunner-XML-Editor-Desktop-main'
$orchestrationWorktree = Join-Path $workspace '.codex_worktrees\agent-orchestration-v2'

git -C $repo fetch origin codex/agent-orchestration-v2
git -C $repo show-ref --verify --quiet refs/heads/codex/agent-orchestration-v2
if ($LASTEXITCODE -eq 0) {
  git -C $repo worktree add $orchestrationWorktree codex/agent-orchestration-v2
}
else {
  git -C $repo worktree add -b codex/agent-orchestration-v2 $orchestrationWorktree origin/codex/agent-orchestration-v2
}
```

Если worktree уже зарегистрирован, повторно его не создавать. Проверить:

```powershell
git -C $repo worktree list --porcelain
git -C $repo status --short --branch
git -C $orchestrationWorktree status --short --branch
```

## 2. Установка workspace adapter

Из orchestration worktree:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File `
  (Join-Path $orchestrationWorktree 'tools\orchestration\install-workspace-adapter.ps1') `
  -Mode Install -WorkspaceRoot $workspace
```

Установщик добавляет только:

- `.codex/config.toml`;
- четыре файла `.codex/agents/*.toml`;
- `.codex/orchestration/manifest.json`, schema и runtime;
- `.agents/skills/orkestr/` и managed manifest;
- локальный `.codex/orchestration/local.json` с путями этого компьютера.

При отличающемся существующем managed-файле операция останавливается до записи. `-Force` разрешён только после ручной проверки конфликта; заменяемые точные файлы будут сохранены в `.codex/orchestration/backups/<timestamp>/`. Лишние файлы внутри managed skill автоматически не удаляются.

После установки закрыть и заново открыть задачу Codex в корне `SnowrunnerXML`: project config и цепочка инструкций строятся при старте сессии.

Проверка установленной копии:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File `
  (Join-Path $orchestrationWorktree 'tools\orchestration\install-workspace-adapter.ps1') `
  -Mode Check -WorkspaceRoot $workspace
```

## 3. Запуск

Однозначный вызов:

```text
$orkestr спроектируй проверяемый импорт нового типа прицепа
```

Допустима прямая свободная речь:

```text
Включи режим оркестрации и продолжи текущую работу с прицепом
```

Вопрос `как работает orkestr?`, пример команды, упоминание в документации и сложная задача без просьбы включить режим запуском не являются.

## 4. Новая задача

Runtime вызывается из корня рабочего пространства:

```powershell
Set-Location $workspace
python .codex\orchestration\bin\task_state.py new `
  --task-id trailer-validation `
  --title 'Проверка прицепа' `
  --objective 'Довести выбранный вариант до проверяемого Editor/game handoff.' `
  --scope-path 'SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem' `
  --constraint 'Не изменять 00_source и не публиковать оригинальные ресурсы.' `
  --next-action 'Прочитать object.json и последний отчёт validation.'
```

`task-id` содержит только строчные латинские буквы, цифры, `.`, `_`, `-`, не длиннее 64 символов. Повторный `new` с существующей remote-веткой останавливается и предлагает `resume`.

## 5. Принятие начатой работы

Флаг фиксирует снимок, но не объявляет изменения корректными:

```powershell
python .codex\orchestration\bin\task_state.py new `
  --task-id tandem-current-work `
  --title 'Продолжение tandem' `
  --objective 'Принять проверенное и продолжить без потери контекста.' `
  --scope-path 'SnowRunner-XML-Editor-Desktop-main/tools/generation' `
  --accept-current-work `
  --working-path (Join-Path $workspace 'SnowRunner-XML-Editor-Desktop-main') `
  --accepted-summary 'Принят только подтверждённый текущий round-trip diff; дальнейшая корректность ещё проверяется.' `
  --next-action 'Проверить diff и запустить релевантный round-trip test.'
```

В `accepted_work` сохраняются branch, HEAD, status и diff-stat. Сами изменённые файлы в state-ветку не копируются.

## 6. Checkpoint

После решения, принятого результата или проверки:

```powershell
python .codex\orchestration\bin\task_state.py checkpoint `
  --task-id trailer-validation `
  --phase validation `
  --summary 'Файловые проверки прошли; Editor/game test ещё не выполнен.' `
  --decision 'Сохраняем текущий физический корень.' `
  --completed 'Проверен XML fragment parser.' `
  --file 'SnowRunner-Modding/objects/trailers/trailer_sideboard_tandem/20_mod/xml/example.xml' `
  --evidence 'validate command: exit 0' `
  --next-action 'Открыть класс в SnowRunner Editor.'
```

Каждый checkpoint коммитится и отправляется в `origin`. `--no-push` допустим только в тестовом/аварийном режиме; после восстановления связи нужно повторить checkpoint без него.

## 7. Продолжение и восстановление

На этом устройстве или после установки adapter на другом:

```powershell
python .codex\orchestration\bin\task_state.py resume --task-id trailer-validation
```

Если cache отсутствует, runtime клонирует только `codex/task-state/trailer-validation`. Если cache есть, допускается только fast-forward. Команда печатает `context.md`; именно его следует передавать главному агенту первым.

Завершённая задача требует явного повторного открытия:

```powershell
python .codex\orchestration\bin\task_state.py resume --task-id trailer-validation --reopen
```

На другом устройстве отдельно восстановить рабочую/feature-ветку редактора и разрешённое хранилище modding assets. State-ветка не содержит `.blend`, FBX, DDS, meshbin и оригинальные ресурсы.

## 8. Просмотр и список

```powershell
python .codex\orchestration\bin\task_state.py show --task-id trailer-validation
python .codex\orchestration\bin\task_state.py list
```

`show` обновляет cache fast-forward и читает только компактный контекст. Для локального просмотра без сети есть `--no-refresh`.

## 9. Архивирование

```powershell
python .codex\orchestration\bin\task_state.py archive `
  --task-id trailer-validation `
  --summary 'Работа приостановлена перед Editor test.' `
  --next-action 'Продолжить с холодного Editor/game теста.'
```

Архив сохраняет remote-ветку и cache. Архивирование задачи в интерфейсе Codex само эту команду не вызывает; проект пока не получает такого события.

## 10. Окончательная очистка

Сначала установить точный идентификатор через `list` или `show`. Затем выполнить отдельную ручную команду:

```powershell
python .codex\orchestration\bin\task_state.py delete `
  --task-id trailer-validation `
  --confirm-task-id trailer-validation
```

Команда:

1. проверяет точное имя remote-ветки;
2. проверяет branch, remote, state id и чистоту cache;
3. удаляет только `codex/task-state/trailer-validation` из `origin`;
4. удаляет только `.codex/orchestration/cache/trailer-validation`.

После удаления восстановление из `origin` невозможно. Очистка всего архива одной широкой командой не поддерживается.

## 11. Диагностика

Исходная ветка:

```powershell
Set-Location $orchestrationWorktree
python tools\orchestration\sync_skill.py --check
python tools\orchestration\validate_orchestration.py
python tools\orchestration\test_task_state.py
git diff --check
```

Установленная среда:

```powershell
Set-Location $workspace
python .codex\orchestration\bin\task_state.py diagnose
powershell -NoProfile -ExecutionPolicy Bypass -File `
  (Join-Path $orchestrationWorktree 'tools\orchestration\install-workspace-adapter.ps1') `
  -Mode Check -WorkspaceRoot $workspace
```

Типовые причины:

| Симптом | Проверка и действие |
|---|---|
| `$orkestr` не виден | Убедиться, что `.agents/skills/orkestr/SKILL.md` установлен, затем перезапустить сессию |
| Custom agent не выбирается | Проверить `.codex/agents/*.toml`, доверие к проекту и новый запуск Codex |
| `state branch already exists` | Использовать `resume`, не создавать второй state с тем же id |
| Cache diverged | Ничего не сбрасывать; сравнить локальный и remote commits и сохранить оба evidence |
| Push не прошёл | Локальный commit остаётся в cache; восстановить доступ и повторить checkpoint |
| Installer сообщает drift | Проверить точный managed-файл; без проверки не использовать `-Force` |
| Недоступна обязательная модель | Сохранить checkpoint и продолжить после появления Astra/Terra/Sol/Luna; модель не подменять |

## 12. Обновление навыка

Редактировать только `instructions/agent-skills/orkestr/`, затем:

```powershell
python tools\orchestration\sync_skill.py
python tools\orchestration\sync_skill.py --check
python tools\orchestration\validate_orchestration.py
```

`.agents/skills/orkestr/` является adapter и вручную не редактируется. После проверок обновить workspace adapter установщиком и снова выполнить `-Mode Check`.

## 13. Откат adapter

Если установка создала backup, копировать назад только конкретный проверенный файл из `.codex/orchestration/backups/<timestamp>/`. Новые managed-файлы можно удалить вручную после сверки списка в разделе 2. Корневой `AGENTS.md` и `.codex/blender-mcp` в откате не участвуют, потому что установщик их не меняет.
