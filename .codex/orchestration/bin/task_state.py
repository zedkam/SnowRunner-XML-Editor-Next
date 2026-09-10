#!/usr/bin/env python3
"""Manage persistent SnowrunnerXML orchestration state branches."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Iterable


BRANCH_PREFIX = "codex/task-state/"
ORCHESTRATION_BRANCH = "codex/agent-orchestration-v2"
TASK_ID_RE = re.compile(r"^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$")
PHASES = ("intake", "research", "design", "implementation", "validation", "handoff")
STATUSES = ("active", "blocked", "complete", "archived")
CONTEXT_MAX_CHARS = 12_000
MODEL_ROUTES = {
    "architecture": "gpt-6-astra",
    "xml_and_scripts": "gpt-5.6-terra",
    "analysis": "gpt-5.6-sol",
    "summary": "gpt-5.6-luna",
}


class StateError(RuntimeError):
    """Expected lifecycle or validation failure."""


def redact_sensitive(value: str) -> str:
    value = re.sub(r"(?i)([a-z][a-z0-9+.-]*://)[^/@\s]+@", r"\1***@", value)
    return re.sub(
        r"(?i)([?&](?:access[_-]?token|api[_-]?key|password|secret|token)=)[^&\s]+",
        r"\1***",
        value,
    )


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def run(
    command: list[str],
    *,
    cwd: Path,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env.setdefault("GIT_TERMINAL_PROMPT", "0")
    completed = subprocess.run(
        command,
        cwd=cwd,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if check and completed.returncode:
        detail = redact_sensitive((completed.stderr or completed.stdout).strip())
        safe_command = [redact_sensitive(item) for item in command]
        raise StateError(f"command failed ({completed.returncode}): {' '.join(safe_command)}\n{detail}")
    return completed


def git(cwd: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return run(["git", *args], cwd=cwd, check=check)


def validate_task_id(task_id: str) -> str:
    if not TASK_ID_RE.fullmatch(task_id):
        raise StateError(
            "task-id must be 1-64 lowercase ASCII characters using letters, digits, dot, underscore, or hyphen; "
            "it must start and end with a letter or digit"
        )
    return task_id


def validate_text(label: str, value: str, limit: int, *, required: bool = False) -> str:
    value = value.strip()
    if required and not value:
        raise StateError(f"{label} must not be empty")
    if len(value) > limit:
        raise StateError(f"{label} exceeds {limit} characters")
    return value


def validate_items(label: str, values: Iterable[str] | None) -> list[str]:
    result: list[str] = []
    for raw in values or []:
        value = validate_text(label, raw, 1000, required=True)
        if value not in result:
            result.append(value)
    return result


def validate_scope_path(value: str) -> str:
    normalized = value.replace("\\", "/").strip("/")
    path = PurePosixPath(normalized)
    if not normalized or path.is_absolute() or ".." in path.parts or "." in path.parts:
        raise StateError(f"scope path must be workspace-relative without traversal: {value!r}")
    if len(normalized) > 500:
        raise StateError("scope path exceeds 500 characters")
    return normalized


def load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise StateError(f"cannot read {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise StateError(f"{path}: expected a JSON object")
    return payload


def find_workspace_from(source: Path) -> Path | None:
    candidates = [source, *source.parents]
    for candidate in candidates:
        if (candidate / "AGENTS.md").is_file() and (candidate / "SnowRunner-Modding").is_dir():
            return candidate.resolve()
    return None


def nearest_git_root(source: Path) -> Path | None:
    result = git(source, "rev-parse", "--show-toplevel", check=False)
    if result.returncode == 0 and result.stdout.strip():
        return Path(result.stdout.strip()).resolve()
    return None


def resolve_runtime(args: argparse.Namespace) -> tuple[Path, Path, Path, str, str]:
    orchestration_dir = Path(__file__).resolve().parent.parent
    local_config_path = orchestration_dir / "local.json"
    local: dict[str, Any] = load_json(local_config_path) if local_config_path.is_file() else {}

    workspace = Path(args.workspace_root).resolve() if args.workspace_root else None
    if workspace is None and isinstance(local.get("workspace_root"), str):
        workspace = Path(local["workspace_root"]).resolve()
    if workspace is None:
        workspace = find_workspace_from(Path.cwd().resolve()) or find_workspace_from(Path(__file__).resolve())

    repository = Path(args.repository).resolve() if args.repository else None
    if repository is None and isinstance(local.get("state_repository"), str):
        repository = Path(local["state_repository"]).resolve()
    if repository is None and workspace is not None:
        candidate = workspace / "SnowRunner-XML-Editor-Desktop-main"
        if candidate.exists():
            repository = candidate.resolve()
    if repository is None:
        repository = nearest_git_root(Path.cwd().resolve()) or nearest_git_root(Path(__file__).resolve().parent)

    if repository is None or nearest_git_root(repository) is None:
        raise StateError("cannot resolve the Git carrier repository; run the workspace adapter installer or use --repository")
    repository = nearest_git_root(repository) or repository

    if workspace is None:
        workspace = find_workspace_from(repository) or repository.parent.resolve()
    if not workspace.is_dir():
        raise StateError(f"workspace root does not exist: {workspace}")

    cache_root = Path(args.cache_root).resolve() if args.cache_root else workspace / ".codex" / "orchestration" / "cache"
    cache_root = cache_root.resolve()
    try:
        cache_root.relative_to(workspace.resolve())
    except ValueError as exc:
        raise StateError("cache root must stay inside the selected workspace") from exc

    remote = args.remote or local.get("remote") or "origin"
    if not isinstance(remote, str) or not re.fullmatch(r"[A-Za-z0-9._-]+", remote):
        raise StateError("remote name contains unsupported characters")
    remote_url_result = git(repository, "remote", "get-url", remote, check=False)
    if remote_url_result.returncode or not remote_url_result.stdout.strip():
        raise StateError(f"Git remote {remote!r} is not configured in {repository}")
    remote_url = remote_url_result.stdout.strip()
    return repository, workspace.resolve(), cache_root, remote, remote_url


def task_branch(task_id: str) -> str:
    return f"{BRANCH_PREFIX}{validate_task_id(task_id)}"


def cache_path(cache_root: Path, task_id: str) -> Path:
    task_id = validate_task_id(task_id)
    path = (cache_root / task_id).resolve()
    if path.parent != cache_root.resolve() or path.name != task_id:
        raise StateError("resolved cache target escaped its exact task directory")
    return path


def remove_tree(path: Path) -> None:
    """Remove one already-validated cache tree, including read-only Git objects on Windows."""

    def make_writable_and_retry(function: Any, target: str, _error: BaseException) -> None:
        current_mode = os.stat(target).st_mode
        os.chmod(target, current_mode | stat.S_IWRITE)
        function(target)

    shutil.rmtree(path, onexc=make_writable_and_retry)


def remote_branch_exists(repository: Path, remote: str, branch: str) -> bool:
    result = git(repository, "ls-remote", "--heads", remote, f"refs/heads/{branch}", check=False)
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()
        raise StateError(f"cannot query {remote}: {detail}")
    return bool(result.stdout.strip())


def copy_git_identity(repository: Path, cache: Path) -> None:
    name = git(repository, "config", "user.name", check=False).stdout.strip() or "Codex Orchestration"
    email = git(repository, "config", "user.email", check=False).stdout.strip() or "codex-orchestration@localhost"
    git(cache, "config", "user.name", name)
    git(cache, "config", "user.email", email)


def relative_workspace_path(path: Path, workspace: Path) -> str:
    try:
        relative = path.resolve().relative_to(workspace.resolve())
    except ValueError as exc:
        raise StateError(f"path is outside the workspace: {path}") from exc
    return relative.as_posix() or "."


def capture_accepted_work(working_path: Path, workspace: Path, summary: str) -> dict[str, Any]:
    if not working_path.exists():
        raise StateError(f"working path does not exist: {working_path}")
    if not working_path.is_dir():
        raise StateError(f"working path must be a directory: {working_path}")
    accepted: dict[str, Any] = {
        "summary": validate_text("accepted summary", summary, 4000, required=True),
        "working_path": relative_workspace_path(working_path, workspace),
        "captured_at": now_utc(),
    }
    git_root_result = git(working_path, "rev-parse", "--show-toplevel", check=False)
    if git_root_result.returncode == 0:
        git_root = Path(git_root_result.stdout.strip()).resolve()
        status = git(git_root, "status", "--short", "--branch").stdout.splitlines()
        diff_stat = git(git_root, "diff", "--stat", "--no-ext-diff").stdout.splitlines()
        accepted["git"] = {
            "root": relative_workspace_path(git_root, workspace),
            "branch": git(git_root, "branch", "--show-current").stdout.strip(),
            "head": git(git_root, "rev-parse", "HEAD").stdout.strip(),
            "status": status[:200],
            "diff_stat": diff_stat[:200],
        }
    else:
        accepted["git"] = None
    return accepted


def dedupe(existing: list[str], additions: Iterable[str]) -> list[str]:
    result = list(existing)
    for item in additions:
        if item not in result:
            result.append(item)
    return result


def clip(value: str, limit: int) -> str:
    if len(value) <= limit:
        return value
    return value[: max(0, limit - 18)].rstrip() + " ... [see state]"


def render_context(state: dict[str, Any]) -> str:
    lines: list[str] = [
        f"# Оркестрация: {state['title']}",
        "",
        f"- task-id: `{state['task_id']}`",
        f"- status: `{state['status']}`",
        f"- phase: `{state['phase']}`",
        f"- revision: `{state['revision']}`",
        f"- branch: `{task_branch(state['task_id'])}`",
        f"- updated: `{state['updated_at']}`",
        "- models: architecture=`gpt-6-astra`, files=`gpt-5.6-terra`, analysis=`gpt-5.6-sol`, summary=`gpt-5.6-luna`",
        "",
        "## Цель",
        "",
        clip(state["objective"], 2400),
    ]

    def add_items(title: str, values: Iterable[str], *, empty: str = "Нет.") -> None:
        heading = ["", f"## {title}", ""]
        if len("\n".join([*lines, *heading, ""])) > CONTEXT_MAX_CHARS - 120:
            return
        lines.extend(heading)
        values_list = list(values)
        if not values_list:
            lines.append(empty)
            return
        omitted = 0
        for index, item in enumerate(values_list):
            candidate = f"- {clip(item, 900)}"
            projected = "\n".join([*lines, candidate, ""])
            if len(projected) > CONTEXT_MAX_CHARS - 120:
                omitted = len(values_list) - index
                break
            lines.append(candidate)
        if omitted:
            lines.append(f"- ... ещё {omitted}; см. `state.json`.")

    # Put the live handoff first: it must survive even when historical lists are long.
    lines.extend(["", "## Текущее состояние", "", clip(state["context"]["current_summary"], 2600) or "Не зафиксировано."])
    add_items("Следующие действия", state["context"]["next_actions"])
    add_items("Область", state["scope_paths"])
    add_items("Ограничения", state["authority"]["constraints"])
    add_items("Принятые решения", state["context"]["decisions"])
    add_items("Открытые вопросы", state["authority"]["open_questions"])
    add_items("Выполнено", state["context"]["completed"])
    add_items("Evidence", state["context"]["evidence"])
    add_items("Затронутые файлы", state["context"]["files"])
    lines.append("")
    result = "\n".join(lines)
    if len(result) > CONTEXT_MAX_CHARS:
        result = result[: CONTEXT_MAX_CHARS - 50].rstrip() + "\n\n[Остальное см. в state.json]\n"
    return result


def validate_state(state: dict[str, Any], expected_id: str) -> None:
    required = {
        "schema_version",
        "task_id",
        "title",
        "objective",
        "status",
        "phase",
        "revision",
        "created_at",
        "updated_at",
        "scope_paths",
        "authority",
        "accepted_work",
        "context",
        "model_routes",
    }
    missing = required - set(state)
    if missing:
        raise StateError(f"state.json misses fields: {', '.join(sorted(missing))}")
    if state["schema_version"] != 1 or state["task_id"] != expected_id:
        raise StateError("state.json schema version or task-id does not match")
    if state["status"] not in STATUSES or state["phase"] not in PHASES:
        raise StateError("state.json contains an unsupported status or phase")
    if not isinstance(state["revision"], int) or state["revision"] < 1:
        raise StateError("state.json revision must be a positive integer")
    if state["model_routes"] != MODEL_ROUTES:
        raise StateError("state.json model routing drifted from the mandatory policy")


def state_directory(cache: Path, task_id: str) -> Path:
    return cache / ".codex" / "task-state" / validate_task_id(task_id)


def append_event(path: Path, event: dict[str, Any]) -> None:
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")


def write_state(cache: Path, state: dict[str, Any], event_type: str, event_summary: str) -> Path:
    validate_state(state, state["task_id"])
    target = state_directory(cache, state["task_id"])
    target.mkdir(parents=True, exist_ok=True)
    (target / "state.json").write_text(
        json.dumps(state, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    (target / "context.md").write_text(render_context(state), encoding="utf-8", newline="\n")
    append_event(
        target / "events.jsonl",
        {
            "at": state["updated_at"],
            "type": event_type,
            "revision": state["revision"],
            "status": state["status"],
            "phase": state["phase"],
            "summary": clip(event_summary, 1000),
        },
    )
    return target


def ensure_only_state_changes(cache: Path, task_id: str) -> None:
    result = git(cache, "status", "--porcelain", "--untracked-files=all")
    prefix = f".codex/task-state/{task_id}/"
    unexpected: list[str] = []
    for line in result.stdout.splitlines():
        path = line[3:].replace("\\", "/") if len(line) >= 4 else line
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        if not path.startswith(prefix):
            unexpected.append(line)
    if unexpected:
        raise StateError("state cache contains unexpected changes: " + "; ".join(unexpected[:20]))


def commit_state(cache: Path, task_id: str, message: str, remote: str, no_push: bool) -> str:
    ensure_only_state_changes(cache, task_id)
    relative = f".codex/task-state/{task_id}"
    git(cache, "add", "--", relative)
    staged = git(cache, "diff", "--cached", "--quiet", check=False)
    if staged.returncode not in (0, 1):
        raise StateError("cannot inspect staged state changes")
    if staged.returncode == 1:
        git(cache, "commit", "-m", message)
    commit = git(cache, "rev-parse", "HEAD").stdout.strip()
    if not no_push:
        git(cache, "push", "--set-upstream", remote, task_branch(task_id))
    return commit


def init_cache(
    repository: Path,
    cache: Path,
    remote: str,
    remote_url: str,
    branch: str,
) -> None:
    if cache.exists():
        raise StateError(f"cache already exists: {cache}")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.mkdir()
    try:
        git(cache, "init")
        git(cache, "checkout", "--orphan", branch)
        git(cache, "remote", "add", remote, remote_url)
        copy_git_identity(repository, cache)
    except Exception:
        if cache.exists():
            try:
                remove_tree(cache)
            except OSError:
                pass
        raise


def verify_cache(cache: Path, task_id: str, remote: str, remote_url: str) -> None:
    if not (cache / ".git").exists():
        raise StateError(f"task cache is not a Git repository: {cache}")
    branch = git(cache, "branch", "--show-current").stdout.strip()
    if branch != task_branch(task_id):
        raise StateError(f"cache branch mismatch: expected {task_branch(task_id)}, got {branch or '<detached>'}")
    cache_remote = git(cache, "remote", "get-url", remote, check=False).stdout.strip()
    if cache_remote != remote_url:
        raise StateError("cache remote does not match the carrier repository remote")
    state_path = state_directory(cache, task_id) / "state.json"
    state = load_json(state_path)
    validate_state(state, task_id)


def ensure_cache(
    repository: Path,
    cache_root: Path,
    task_id: str,
    remote: str,
    remote_url: str,
    *,
    refresh: bool = True,
) -> Path:
    cache = cache_path(cache_root, task_id)
    branch = task_branch(task_id)
    if cache.exists():
        verify_cache(cache, task_id, remote, remote_url)
        ensure_only_state_changes(cache, task_id)
        if git(cache, "status", "--porcelain").stdout.strip():
            raise StateError("task cache has uncommitted state; checkpoint or inspect it before refresh")
        if refresh:
            git(cache, "fetch", remote, branch)
            git(cache, "merge", "--ff-only", "FETCH_HEAD")
        return cache

    if not remote_branch_exists(repository, remote, branch):
        raise StateError(f"state branch does not exist in {remote}: {branch}")
    cache.parent.mkdir(parents=True, exist_ok=True)
    git(repository, "clone", "--single-branch", "--branch", branch, remote_url, str(cache))
    copy_git_identity(repository, cache)
    verify_cache(cache, task_id, remote, remote_url)
    return cache


def read_state(cache: Path, task_id: str) -> dict[str, Any]:
    state = load_json(state_directory(cache, task_id) / "state.json")
    validate_state(state, task_id)
    return state


def bump(state: dict[str, Any]) -> None:
    state["revision"] += 1
    state["updated_at"] = now_utc()


def print_result(**values: Any) -> None:
    print(json.dumps(values, ensure_ascii=False, indent=2))


def action_new(args: argparse.Namespace, runtime: tuple[Path, Path, Path, str, str]) -> None:
    repository, workspace, cache_root, remote, remote_url = runtime
    task_id = validate_task_id(args.task_id)
    branch = task_branch(task_id)
    title = validate_text("title", args.title, 200, required=True)
    objective = validate_text("objective", args.objective, 4000, required=True)
    scope_paths = [validate_scope_path(item) for item in (args.scope_path or [])]
    constraints = validate_items("constraint", args.constraint)
    open_questions = validate_items("open question", args.open_question)
    next_actions = validate_items("next action", args.next_action)
    accepted_work = None
    if args.accept_current_work:
        if not args.working_path or not args.accepted_summary:
            raise StateError("--accept-current-work requires --working-path and --accepted-summary")
        accepted_work = capture_accepted_work(Path(args.working_path).resolve(), workspace, args.accepted_summary)
    elif args.working_path or args.accepted_summary:
        raise StateError("--working-path and --accepted-summary require --accept-current-work")

    if remote_branch_exists(repository, remote, branch):
        raise StateError(f"state branch already exists; use resume: {branch}")
    cache = cache_path(cache_root, task_id)
    init_cache(repository, cache, remote, remote_url, branch)

    created = now_utc()
    state: dict[str, Any] = {
        "schema_version": 1,
        "task_id": task_id,
        "title": title,
        "objective": objective,
        "status": "active",
        "phase": "intake",
        "revision": 1,
        "created_at": created,
        "updated_at": created,
        "scope_paths": list(dict.fromkeys(scope_paths)),
        "authority": {
            "constraints": constraints,
            "open_questions": open_questions,
        },
        "accepted_work": accepted_work,
        "context": {
            "current_summary": accepted_work["summary"] if accepted_work else "Задача создана; работа ещё не принята.",
            "decisions": [],
            "completed": ["Принято текущее состояние работы."] if accepted_work else [],
            "next_actions": next_actions,
            "files": [],
            "evidence": [],
        },
        "model_routes": MODEL_ROUTES.copy(),
    }
    try:
        write_state(cache, state, "created", state["context"]["current_summary"])
        commit = commit_state(cache, task_id, f"Initialize orchestration state {task_id}", remote, args.no_push)
    except Exception:
        raise
    print_result(task_id=task_id, status="active", branch=branch, cache=str(cache), commit=commit, pushed=not args.no_push)


def action_checkpoint(args: argparse.Namespace, runtime: tuple[Path, Path, Path, str, str]) -> None:
    repository, _workspace, cache_root, remote, remote_url = runtime
    task_id = validate_task_id(args.task_id)
    cache = ensure_cache(repository, cache_root, task_id, remote, remote_url)
    state = read_state(cache, task_id)
    if state["status"] == "archived":
        raise StateError("task is archived; resume it before writing a checkpoint")

    bump(state)
    if args.phase:
        state["phase"] = args.phase
    if args.status:
        state["status"] = args.status
    state["context"]["current_summary"] = validate_text("summary", args.summary, 4000, required=True)
    if args.next_action is not None:
        state["context"]["next_actions"] = validate_items("next action", args.next_action)
    state["authority"]["constraints"] = dedupe(
        state["authority"]["constraints"], validate_items("constraint", args.constraint)
    )
    if args.clear_open_questions:
        state["authority"]["open_questions"] = []
    state["authority"]["open_questions"] = dedupe(
        state["authority"]["open_questions"], validate_items("open question", args.open_question)
    )
    for key, values, label in (
        ("decisions", args.decision, "decision"),
        ("completed", args.completed, "completed item"),
        ("files", args.file, "file"),
        ("evidence", args.evidence, "evidence"),
    ):
        state["context"][key] = dedupe(state["context"][key], validate_items(label, values))

    write_state(cache, state, "checkpoint", state["context"]["current_summary"])
    commit = commit_state(cache, task_id, f"Checkpoint orchestration state {task_id}", remote, args.no_push)
    print_result(
        task_id=task_id,
        status=state["status"],
        phase=state["phase"],
        revision=state["revision"],
        branch=task_branch(task_id),
        commit=commit,
        pushed=not args.no_push,
    )


def action_resume(args: argparse.Namespace, runtime: tuple[Path, Path, Path, str, str]) -> None:
    repository, _workspace, cache_root, remote, remote_url = runtime
    task_id = validate_task_id(args.task_id)
    cache = ensure_cache(repository, cache_root, task_id, remote, remote_url)
    state = read_state(cache, task_id)
    changed = False
    if state["status"] == "complete" and not args.reopen:
        raise StateError("task is complete; use --reopen only when the user explicitly asks to continue it")
    if state["status"] != "active":
        bump(state)
        state["status"] = "active"
        write_state(cache, state, "resumed", "Task resumed from stored state.")
        commit_state(cache, task_id, f"Resume orchestration state {task_id}", remote, args.no_push)
        changed = True
    context = state_directory(cache, task_id) / "context.md"
    if changed:
        context.write_text(render_context(state), encoding="utf-8", newline="\n")
    print(context.read_text(encoding="utf-8"), end="")


def action_show(args: argparse.Namespace, runtime: tuple[Path, Path, Path, str, str]) -> None:
    repository, _workspace, cache_root, remote, remote_url = runtime
    task_id = validate_task_id(args.task_id)
    cache = ensure_cache(repository, cache_root, task_id, remote, remote_url, refresh=not args.no_refresh)
    context = state_directory(cache, task_id) / "context.md"
    print(context.read_text(encoding="utf-8"), end="")


def action_archive(args: argparse.Namespace, runtime: tuple[Path, Path, Path, str, str]) -> None:
    repository, _workspace, cache_root, remote, remote_url = runtime
    task_id = validate_task_id(args.task_id)
    cache = ensure_cache(repository, cache_root, task_id, remote, remote_url)
    state = read_state(cache, task_id)
    if state["status"] == "archived":
        print_result(task_id=task_id, status="archived", branch=task_branch(task_id), changed=False)
        return
    bump(state)
    state["status"] = "archived"
    state["phase"] = "handoff"
    state["context"]["current_summary"] = validate_text("summary", args.summary, 4000, required=True)
    state["context"]["next_actions"] = validate_items("next action", args.next_action)
    write_state(cache, state, "archived", state["context"]["current_summary"])
    commit = commit_state(cache, task_id, f"Archive orchestration state {task_id}", remote, args.no_push)
    print_result(
        task_id=task_id,
        status="archived",
        branch=task_branch(task_id),
        cache=str(cache),
        commit=commit,
        pushed=not args.no_push,
    )


def action_delete(args: argparse.Namespace, runtime: tuple[Path, Path, Path, str, str]) -> None:
    repository, _workspace, cache_root, remote, remote_url = runtime
    task_id = validate_task_id(args.task_id)
    if args.confirm_task_id != task_id:
        raise StateError("--confirm-task-id must exactly match --task-id")
    branch = task_branch(task_id)
    cache = cache_path(cache_root, task_id)
    if not remote_branch_exists(repository, remote, branch):
        raise StateError(f"refusing deletion because the exact remote branch does not exist: {branch}")

    if cache.exists():
        verify_cache(cache, task_id, remote, remote_url)
        if git(cache, "status", "--porcelain").stdout.strip():
            raise StateError("refusing deletion because the task cache has uncommitted changes")
    if cache.exists():
        resolved = cache.resolve()
        if resolved.parent != cache_root.resolve() or resolved.name != task_id:
            raise StateError("local cache safety validation failed")
        remove_tree(resolved)
    git(repository, "push", remote, "--delete", branch)
    print_result(task_id=task_id, deleted_branch=branch, deleted_cache=str(cache), recoverable_from_origin=False)


def action_list(_args: argparse.Namespace, runtime: tuple[Path, Path, Path, str, str]) -> None:
    repository, _workspace, cache_root, remote, _remote_url = runtime
    result = git(repository, "ls-remote", "--heads", remote, f"refs/heads/{BRANCH_PREFIX}*")
    tasks: list[dict[str, Any]] = []
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        sha, ref = line.split(maxsplit=1)
        branch = ref.removeprefix("refs/heads/")
        task_id = branch.removeprefix(BRANCH_PREFIX)
        item: dict[str, Any] = {"task_id": task_id, "branch": branch, "remote_commit": sha}
        local_state = state_directory(cache_path(cache_root, task_id), task_id) / "state.json"
        if local_state.is_file():
            state = load_json(local_state)
            item.update(status=state.get("status"), phase=state.get("phase"), revision=state.get("revision"))
        else:
            item["status"] = "remote-only"
        tasks.append(item)
    print_result(tasks=tasks, count=len(tasks))


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def action_diagnose(_args: argparse.Namespace, runtime: tuple[Path, Path, Path, str, str]) -> None:
    repository, workspace, cache_root, remote, _remote_url = runtime
    agents = workspace / "AGENTS.md"
    blender = workspace / ".codex" / "blender-mcp"
    orchestration_remote = remote_branch_exists(repository, remote, ORCHESTRATION_BRANCH)
    result = git(repository, "ls-remote", "--heads", remote, f"refs/heads/{BRANCH_PREFIX}*")
    print_result(
        ok=agents.is_file() and orchestration_remote,
        workspace=str(workspace),
        repository=str(repository),
        remote=remote,
        orchestration_branch_in_origin=orchestration_remote,
        task_branch_count=len([line for line in result.stdout.splitlines() if line.strip()]),
        cache_root=str(cache_root),
        root_agents_sha256=hash_file(agents) if agents.is_file() else None,
        blender_mcp_preserved=blender.is_dir(),
    )


def add_runtime_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--repository", help="Git carrier repository; normally resolved from local.json.")
    parser.add_argument("--workspace-root", help="SnowrunnerXML workspace root; normally resolved from local.json.")
    parser.add_argument("--cache-root", help="Override the task cache root for diagnostics or tests.")
    parser.add_argument("--remote", help="Git remote name (default: origin).")


def add_no_push(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--no-push", action="store_true", help="Keep the change local; diagnostics/tests only.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    add_runtime_arguments(parser)
    subparsers = parser.add_subparsers(dest="action", required=True)

    new = subparsers.add_parser("new", help="Create and push a metadata-only task state branch.")
    new.add_argument("--task-id", required=True)
    new.add_argument("--title", required=True)
    new.add_argument("--objective", required=True)
    new.add_argument("--scope-path", action="append")
    new.add_argument("--constraint", action="append")
    new.add_argument("--open-question", action="append")
    new.add_argument("--next-action", action="append")
    new.add_argument("--accept-current-work", action="store_true")
    new.add_argument("--working-path")
    new.add_argument("--accepted-summary")
    add_no_push(new)
    new.set_defaults(handler=action_new)

    checkpoint = subparsers.add_parser("checkpoint", help="Commit a verified compact checkpoint.")
    checkpoint.add_argument("--task-id", required=True)
    checkpoint.add_argument("--summary", required=True)
    checkpoint.add_argument("--phase", choices=PHASES)
    checkpoint.add_argument("--status", choices=("active", "blocked", "complete"))
    checkpoint.add_argument("--next-action", action="append")
    checkpoint.add_argument("--constraint", action="append")
    checkpoint.add_argument("--decision", action="append")
    checkpoint.add_argument("--completed", action="append")
    checkpoint.add_argument("--file", action="append")
    checkpoint.add_argument("--evidence", action="append")
    checkpoint.add_argument("--open-question", action="append")
    checkpoint.add_argument("--clear-open-questions", action="store_true")
    add_no_push(checkpoint)
    checkpoint.set_defaults(handler=action_checkpoint)

    resume = subparsers.add_parser("resume", help="Restore a task cache from origin and print its compact context.")
    resume.add_argument("--task-id", required=True)
    resume.add_argument("--reopen", action="store_true")
    add_no_push(resume)
    resume.set_defaults(handler=action_resume)

    show = subparsers.add_parser("show", help="Print context.md without loading the event history.")
    show.add_argument("--task-id", required=True)
    show.add_argument("--no-refresh", action="store_true")
    show.set_defaults(handler=action_show)

    archive = subparsers.add_parser("archive", help="Archive while retaining remote state and local cache.")
    archive.add_argument("--task-id", required=True)
    archive.add_argument("--summary", required=True)
    archive.add_argument("--next-action", required=True, action="append")
    add_no_push(archive)
    archive.set_defaults(handler=action_archive)

    delete = subparsers.add_parser("delete", help="Delete one exact task branch and cache after confirmation.")
    delete.add_argument("--task-id", required=True)
    delete.add_argument("--confirm-task-id", required=True)
    delete.set_defaults(handler=action_delete)

    listing = subparsers.add_parser("list", help="List task state branches without cloning them.")
    listing.set_defaults(handler=action_list)

    diagnose = subparsers.add_parser("diagnose", help="Check runtime paths, origin, protected files, and state refs.")
    diagnose.set_defaults(handler=action_diagnose)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        runtime = resolve_runtime(args)
        args.handler(args, runtime)
        return 0
    except StateError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
