#!/usr/bin/env python3
"""Validate the SnowrunnerXML manual orchestration architecture."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tomllib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
EXPECTED_MODELS = {
    "snowrunner-architect.toml": ("snowrunner_architect", "gpt-6-astra", "high", "read-only"),
    "snowrunner-xml-worker.toml": ("snowrunner_xml_worker", "gpt-5.6-terra", "high", "workspace-write"),
    "snowrunner-analyst.toml": ("snowrunner_analyst", "gpt-5.6-sol", "high", "read-only"),
    "snowrunner-summarizer.toml": ("snowrunner_summarizer", "gpt-5.6-luna", "low", "read-only"),
}
ALLOWED_CHANGE_PREFIXES = (
    ".agents/",
    ".codex/",
    "docs/architecture/AGENT_ORCHESTRATION.md",
    "docs/architecture/README.md",
    "docs/developers/CODEX_ORCHESTRATION_ADMIN.md",
    "instructions/agent-skills/orkestr/",
    "tools/orchestration/",
    "package.json",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="codex/agent-config-backup", help="Git base used for change-boundary checks.")
    parser.add_argument("--skip-git", action="store_true", help="Skip branch and change-boundary checks.")
    return parser.parse_args()


def package_files(path: Path) -> dict[str, bytes]:
    return {
        item.relative_to(path).as_posix(): item.read_bytes()
        for item in sorted(path.rglob("*"))
        if item.is_file() and "__pycache__" not in item.parts
    }


def run_git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if check and result.returncode:
        raise RuntimeError((result.stderr or result.stdout).strip())
    return result


def find_workspace() -> Path | None:
    for candidate in [ROOT, *ROOT.parents]:
        if (candidate / "AGENTS.md").is_file() and (candidate / "SnowRunner-Modding").is_dir():
            return candidate
    return None


def check_skill(errors: list[str]) -> None:
    canonical = ROOT / "instructions" / "agent-skills" / "orkestr"
    adapter = ROOT / ".agents" / "skills" / "orkestr"
    if not (canonical / "SKILL.md").is_file():
        errors.append("missing canonical orkestr SKILL.md")
        return
    if package_files(canonical) != package_files(adapter):
        errors.append("canonical skill and .agents adapter are not byte-identical")

    lines = (canonical / "SKILL.md").read_text(encoding="utf-8").splitlines()
    if not lines or lines[0] != "---" or lines.count("---") < 2:
        errors.append("SKILL.md frontmatter is invalid")
    else:
        closing = lines.index("---", 1)
        frontmatter = "\n".join(lines[1:closing])
        if "name: orkestr" not in frontmatter:
            errors.append("SKILL.md name is not orkestr")
        for required_phrase in ("прямо просит", "Не запускать", "$orkestr"):
            if required_phrase not in frontmatter:
                errors.append(f"SKILL.md description misses activation boundary: {required_phrase}")

    openai_yaml = (canonical / "agents" / "openai.yaml").read_text(encoding="utf-8")
    if "allow_implicit_invocation: true" not in openai_yaml:
        errors.append("openai.yaml must allow strict semantic intent matching")
    if "default_prompt:" not in openai_yaml or "$orkestr" not in openai_yaml:
        errors.append("openai.yaml default_prompt must explicitly mention $orkestr")


def check_codex_config(errors: list[str]) -> None:
    config_path = ROOT / ".codex" / "config.toml"
    try:
        config = tomllib.loads(config_path.read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError) as exc:
        errors.append(f"invalid .codex/config.toml: {exc}")
        return
    agents = config.get("agents", {})
    if agents.get("enabled") is not True or agents.get("max_concurrent_threads_per_session") != 3:
        errors.append(".codex/config.toml must enable agents with a concurrency cap of 3")

    manifest = json.loads((ROOT / ".codex" / "orchestration" / "manifest.json").read_text(encoding="utf-8"))
    manifest_models = manifest.get("models", {})
    for filename, (name, model, effort, sandbox) in EXPECTED_MODELS.items():
        path = ROOT / ".codex" / "agents" / filename
        try:
            payload = tomllib.loads(path.read_text(encoding="utf-8"))
        except (OSError, tomllib.TOMLDecodeError) as exc:
            errors.append(f"invalid custom agent {filename}: {exc}")
            continue
        expected = {
            "name": name,
            "model": model,
            "model_reasoning_effort": effort,
            "sandbox_mode": sandbox,
        }
        for key, value in expected.items():
            if payload.get(key) != value:
                errors.append(f"{filename}: expected {key}={value!r}, got {payload.get(key)!r}")
        if not payload.get("description") or not payload.get("developer_instructions"):
            errors.append(f"{filename}: description and developer_instructions are required")

    expected_manifest = {
        "architecture": ("snowrunner_architect", "gpt-6-astra", "high"),
        "xml_and_scripts": ("snowrunner_xml_worker", "gpt-5.6-terra", "high"),
        "analysis": ("snowrunner_analyst", "gpt-5.6-sol", "high"),
        "summary": ("snowrunner_summarizer", "gpt-5.6-luna", "low"),
    }
    for route, (agent, model, effort) in expected_manifest.items():
        actual = manifest_models.get(route, {})
        if (actual.get("agent"), actual.get("model"), actual.get("reasoning_effort")) != (agent, model, effort):
            errors.append(f"manifest model route drift: {route}")

    activation = manifest.get("activation", {})
    if not activation.get("semantic_explicit_intent") or activation.get("complexity_is_activation"):
        errors.append("manifest activation policy is not strict explicit intent")
    state = manifest.get("state", {})
    if state.get("branch_kind") != "orphan-metadata-only" or state.get("merge_into_product_branches") is not False:
        errors.append("manifest task-state branch policy is unsafe")


def check_runtime_and_docs(errors: list[str]) -> None:
    runtime = ROOT / ".codex" / "orchestration" / "bin" / "task_state.py"
    try:
        compile(runtime.read_text(encoding="utf-8"), str(runtime), "exec")
    except (OSError, SyntaxError) as exc:
        errors.append(f"task_state.py does not compile: {exc}")

    for path in (
        ROOT / ".codex" / "orchestration" / "task-state.schema.json",
        ROOT / ".codex" / "orchestration" / "manifest.json",
    ):
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"invalid JSON {path.relative_to(ROOT)}: {exc}")

    for relative in (
        "docs/architecture/AGENT_ORCHESTRATION.md",
        "docs/developers/CODEX_ORCHESTRATION_ADMIN.md",
        "tools/orchestration/install-workspace-adapter.ps1",
        "tools/orchestration/sync_skill.py",
    ):
        if not (ROOT / relative).is_file():
            errors.append(f"missing required file: {relative}")

    installer = (ROOT / "tools" / "orchestration" / "install-workspace-adapter.ps1").read_text(encoding="utf-8")
    for protected in ("AGENTS.md", ".codex\\blender-mcp"):
        if protected not in installer:
            errors.append(f"installer does not protect {protected}")

    workspace = find_workspace()
    if workspace is None:
        errors.append("cannot find workspace root with AGENTS.md and SnowRunner-Modding")
    elif not (workspace / ".codex" / "blender-mcp").is_dir():
        errors.append("existing workspace .codex/blender-mcp is missing")
    if (ROOT / "AGENTS.md").exists():
        errors.append("orchestration branch must not add a repository-root AGENTS.md")


def parse_status_paths() -> list[str]:
    result = run_git("status", "--porcelain=v1", "--untracked-files=all")
    paths: list[str] = []
    for line in result.stdout.splitlines():
        if len(line) < 4:
            continue
        path = line[3:].replace("\\", "/")
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        paths.append(path)
    return paths


def check_git(errors: list[str], base: str) -> None:
    branch = run_git("branch", "--show-current").stdout.strip()
    if branch != "codex/agent-orchestration-v2":
        errors.append(f"wrong branch: {branch!r}")
    if run_git("show-ref", "--verify", "--quiet", f"refs/heads/{base}", check=False).returncode:
        errors.append(f"backup branch is missing: {base}")

    changed = set(parse_status_paths())
    committed = run_git("diff", "--name-only", f"{base}...HEAD", check=False)
    if committed.returncode == 0:
        changed.update(path.strip().replace("\\", "/") for path in committed.stdout.splitlines() if path.strip())
    for path in sorted(changed):
        if path == "AGENTS.md" or not any(path == prefix or path.startswith(prefix) for prefix in ALLOWED_CHANGE_PREFIXES):
            errors.append(f"change outside orchestration scope: {path}")

    backup_sha = run_git("rev-parse", base, check=False).stdout.strip()
    if backup_sha and run_git("merge-base", "--is-ancestor", base, "HEAD", check=False).returncode:
        errors.append("orchestration branch does not descend from the backup branch")


def main() -> int:
    args = parse_args()
    errors: list[str] = []
    try:
        check_skill(errors)
        check_codex_config(errors)
        check_runtime_and_docs(errors)
        if not args.skip_git:
            check_git(errors, args.base)
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        errors.append(str(exc))

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        print(f"FAILED: {len(errors)} orchestration validation error(s)")
        return 1
    print("OK: manual orchestration architecture is internally consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
