#!/usr/bin/env python3
"""End-to-end tests for the metadata-only task state lifecycle."""

from __future__ import annotations

import json
import importlib.util
import os
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / ".codex" / "orchestration" / "bin" / "task_state.py"


def load_runtime_module() -> object:
    spec = importlib.util.spec_from_file_location("snowrunner_task_state", SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load runtime module: {SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(command: list[str], cwd: Path, *, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if check and result.returncode:
        raise AssertionError(f"command failed: {' '.join(command)}\nstdout={result.stdout}\nstderr={result.stderr}")
    return result


class TaskStateLifecycleTest(unittest.TestCase):
    def test_diagnostics_redact_credentials(self) -> None:
        runtime = load_runtime_module()
        raw = "fatal: https://user:password@example.invalid/repo?access_token=abc123&mode=1"
        redacted = runtime.redact_sensitive(raw)  # type: ignore[attr-defined]
        self.assertNotIn("user:password", redacted)
        self.assertNotIn("abc123", redacted)
        self.assertIn("https://***@example.invalid", redacted)
        self.assertIn("access_token=***", redacted)

    def setUp(self) -> None:
        self.temp = Path(tempfile.mkdtemp(prefix="snowrunner-orchestration-test-"))
        self.workspace = self.temp / "SnowrunnerXML"
        self.carrier = self.workspace / "SnowRunner-XML-Editor-Desktop-main"
        self.modding = self.workspace / "SnowRunner-Modding"
        self.cache_root = self.workspace / ".codex" / "orchestration" / "cache"
        self.remote = self.temp / "origin.git"
        self.workspace.mkdir()
        self.carrier.mkdir()
        self.modding.mkdir()
        (self.workspace / "AGENTS.md").write_text("# Test workspace\n", encoding="utf-8")

        run(["git", "init", "--bare", str(self.remote)], self.temp)
        run(["git", "init", "-b", "main"], self.carrier)
        run(["git", "config", "user.name", "Test User"], self.carrier)
        run(["git", "config", "user.email", "test@example.invalid"], self.carrier)
        run(["git", "commit", "--allow-empty", "-m", "Initial"], self.carrier)
        run(["git", "remote", "add", "origin", str(self.remote)], self.carrier)
        run(["git", "push", "-u", "origin", "main"], self.carrier)
        run(["git", "branch", "codex/agent-orchestration-v2"], self.carrier)
        run(["git", "push", "origin", "codex/agent-orchestration-v2"], self.carrier)

    def tearDown(self) -> None:
        def make_writable_and_retry(function: object, target: str, _error: BaseException) -> None:
            current_mode = os.stat(target).st_mode
            os.chmod(target, current_mode | stat.S_IWRITE)
            function(target)  # type: ignore[operator]

        if self.temp.exists():
            shutil.rmtree(self.temp, onexc=make_writable_and_retry)

    def state_command(self, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        command = [
            sys.executable,
            str(SCRIPT),
            "--repository",
            str(self.carrier),
            "--workspace-root",
            str(self.workspace),
            "--cache-root",
            str(self.cache_root),
            *args,
        ]
        return run(command, self.workspace, check=check)

    def remote_branch_exists(self, task_id: str) -> bool:
        result = run(
            ["git", "--git-dir", str(self.remote), "show-ref", "--verify", "--quiet", f"refs/heads/codex/task-state/{task_id}"],
            self.temp,
            check=False,
        )
        return result.returncode == 0

    def load_state(self, task_id: str) -> dict[str, object]:
        path = self.cache_root / task_id / ".codex" / "task-state" / task_id / "state.json"
        return json.loads(path.read_text(encoding="utf-8"))

    def test_full_lifecycle_uses_orphan_branch_and_exact_delete(self) -> None:
        task_id = "trailer-context"
        created = self.state_command(
            "new",
            "--task-id",
            task_id,
            "--title",
            "Trailer context",
            "--objective",
            "Keep a compact verified state.",
            "--scope-path",
            "SnowRunner-Modding/objects/trailers/example",
            "--constraint",
            "Do not publish source assets.",
            "--next-action",
            "Inspect object.json.",
        )
        self.assertIn('"pushed": true', created.stdout)
        self.assertTrue(self.remote_branch_exists(task_id))

        branch = f"codex/task-state/{task_id}"
        tree = run(["git", "--git-dir", str(self.remote), "ls-tree", "-r", "--name-only", branch], self.temp).stdout.splitlines()
        self.assertEqual(
            tree,
            [
                f".codex/task-state/{task_id}/context.md",
                f".codex/task-state/{task_id}/events.jsonl",
                f".codex/task-state/{task_id}/state.json",
            ],
        )
        no_common_history = run(
            ["git", "--git-dir", str(self.remote), "merge-base", branch, "codex/agent-orchestration-v2"],
            self.temp,
            check=False,
        )
        self.assertNotEqual(no_common_history.returncode, 0)

        self.state_command(
            "checkpoint",
            "--task-id",
            task_id,
            "--phase",
            "implementation",
            "--summary",
            "XML worker result accepted.",
            "--decision",
            "Preserve the existing object route.",
            "--completed",
            "Checked object.json.",
            "--evidence",
            "Validation passed.",
            "--next-action",
            "Run Editor validation.",
        )
        checkpointed = self.load_state(task_id)
        self.assertEqual(checkpointed["revision"], 2)
        self.assertEqual(checkpointed["model_routes"]["xml_and_scripts"], "gpt-5.6-terra")

        self.state_command(
            "archive",
            "--task-id",
            task_id,
            "--summary",
            "Paused after file validation.",
            "--next-action",
            "Resume with Editor validation.",
        )
        self.assertEqual(self.load_state(task_id)["status"], "archived")

        resumed = self.state_command("resume", "--task-id", task_id)
        self.assertIn("status: `active`", resumed.stdout)
        self.assertEqual(self.load_state(task_id)["status"], "active")

        rejected = self.state_command(
            "delete",
            "--task-id",
            task_id,
            "--confirm-task-id",
            "different-task",
            check=False,
        )
        self.assertNotEqual(rejected.returncode, 0)
        self.assertTrue(self.remote_branch_exists(task_id))

        self.state_command("delete", "--task-id", task_id, "--confirm-task-id", task_id)
        self.assertFalse(self.remote_branch_exists(task_id))
        self.assertFalse((self.cache_root / task_id).exists())

    def test_invalid_task_id_is_rejected_before_cache_creation(self) -> None:
        result = self.state_command(
            "new",
            "--task-id",
            "../escape",
            "--title",
            "Invalid",
            "--objective",
            "Must fail.",
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.cache_root.exists())

    def test_accept_current_work_records_exact_dirty_git_snapshot(self) -> None:
        task_id = "accepted-work"
        pending = self.carrier / "pending.txt"
        pending.write_text("user work\n", encoding="utf-8")
        self.state_command(
            "new",
            "--task-id",
            task_id,
            "--title",
            "Adopt current work",
            "--objective",
            "Preserve the verified starting point.",
            "--scope-path",
            "SnowRunner-XML-Editor-Desktop-main/pending.txt",
            "--accept-current-work",
            "--working-path",
            str(self.carrier),
            "--accepted-summary",
            "The untracked file is recorded as user work, not accepted as correct.",
            "--next-action",
            "Inspect pending.txt.",
        )
        state = self.load_state(task_id)
        accepted = state["accepted_work"]
        self.assertEqual(accepted["git"]["branch"], "main")
        self.assertTrue(any("pending.txt" in line for line in accepted["git"]["status"]))
        self.assertEqual(accepted["git"]["root"], "SnowRunner-XML-Editor-Desktop-main")
        self.state_command("delete", "--task-id", task_id, "--confirm-task-id", task_id)

    def test_compact_context_preserves_live_handoff_before_long_history(self) -> None:
        task_id = "bounded-context"
        command = [
            "new",
            "--task-id",
            task_id,
            "--title",
            "Bounded context",
            "--objective",
            "Keep the live handoff inside the compact context budget.",
            "--next-action",
            "MUST_SURVIVE_NEXT_ACTION",
        ]
        for index in range(30):
            command.extend(["--constraint", f"constraint-{index:02d}-" + ("x" * 700)])
        self.state_command(*command)

        context = (
            self.cache_root
            / task_id
            / ".codex"
            / "task-state"
            / task_id
            / "context.md"
        ).read_text(encoding="utf-8")
        self.assertLessEqual(len(context), 12_000)
        self.assertIn("## Текущее состояние", context)
        self.assertIn("MUST_SURVIVE_NEXT_ACTION", context)
        self.assertIn("см. `state.json`", context)
        self.state_command("delete", "--task-id", task_id, "--confirm-task-id", task_id)


if __name__ == "__main__":
    unittest.main(verbosity=2)
