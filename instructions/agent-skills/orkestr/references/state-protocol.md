# Протокол состояния

## Источник истины

Менеджер состояния устанавливается в рабочее пространство как `.codex/orchestration/bin/task_state.py`. Он использует вложенный Git-репозиторий редактора только для получения `origin`; каждое состояние хранится в отдельном небольшом cache-репозитории и в orphan-ветке того же remote.

Ветка содержит только:

```text
.codex/task-state/<task-id>/
├─ state.json
├─ context.md
└─ events.jsonl
```

`context.md` — первый и обычно единственный файл для возобновления. `state.json` хранит структурированные детали. `events.jsonl` — компактный журнал для диагностики, его не следует загружать целиком в обычный prompt.

## Основные команды

Команды выполняются из корня `SnowrunnerXML`:

```powershell
python .codex/orchestration/bin/task_state.py new --task-id <id> --title "<title>" --objective "<objective>" --scope-path "SnowRunner-XML-Editor-Desktop-main/<path>"
python .codex/orchestration/bin/task_state.py new --task-id <id> --title "<title>" --objective "<objective>" --accept-current-work --working-path "<path>" --accepted-summary "<what is accepted>"
python .codex/orchestration/bin/task_state.py resume --task-id <id>
python .codex/orchestration/bin/task_state.py checkpoint --task-id <id> --phase implementation --summary "<current state>" --next-action "<next action>"
python .codex/orchestration/bin/task_state.py archive --task-id <id> --summary "<last state>" --next-action "<resume action>"
python .codex/orchestration/bin/task_state.py delete --task-id <id> --confirm-task-id <id>
```

Используй `--constraint`, `--decision`, `--completed`, `--file`, `--evidence` и `--open-question` повторно для добавления нескольких значений. `--no-push` разрешён только для локальной диагностики и тестов; рабочее состояние после checkpoint должно оказаться в `origin`.

## Принятие текущей работы

`--accept-current-work` не объявляет найденные файлы правильными. Он фиксирует точный Git snapshot, status/diff-stat и данное пользователем или проверенное оркестратором краткое описание. Не коммить пользовательские изменения в ветку состояния: она хранит только метаданные.

Для `SnowRunner-Modding` в состоянии сохраняются относительные пути, решения, хеши и evidence. Большие `.blend`, FBX, meshbin, DDS и оригинальные игровые ресурсы не отправляются в state-ветку и требуют отдельного разрешённого хранилища для восстановления на другом устройстве.

## Приёмка результата исполнителя

Checkpoint записывается после того, как главный агент:

1. сверил результат с назначенной подзадачей и разрешёнными путями;
2. проверил существенные файлы или diff;
3. записал выполненные проверки и их результат в `evidence`;
4. сохранил только вывод, влияющий на дальнейшие решения.

Полный transcript, логи сборки и повторяемый сырой XML в `context.md` не копируются.

Секреты, токены, пароли, ключи, cookies и данные сессий не входят ни в один state-файл и не отправляются в `origin`. Если доступ нужен для продолжения, фиксируется только название требуемого локального подключения без его значения.
