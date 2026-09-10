#!/usr/bin/env python3
"""Synchronize the canonical orkestr skill with the repository adapter."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "instructions" / "agent-skills" / "orkestr"
TARGET_ROOT = ROOT / ".agents" / "skills"
TARGET = TARGET_ROOT / "orkestr"
STATE = TARGET_ROOT / ".snowrunnerxml-managed-skills.json"
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report drift without writing files.")
    return parser.parse_args()


def parse_frontmatter(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0] != "---":
        raise ValueError(f"{path}: missing opening YAML frontmatter")
    try:
        end = lines.index("---", 1)
    except ValueError as exc:
        raise ValueError(f"{path}: missing closing YAML frontmatter") from exc

    result: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip():
            continue
        if ":" not in line:
            raise ValueError(f"{path}: invalid frontmatter line {line!r}")
        key, value = line.split(":", 1)
        result[key.strip()] = value.strip()

    if set(result) != {"name", "description"}:
        raise ValueError(f"{path}: frontmatter must contain only name and description")
    if result["name"] != "orkestr" or not NAME_RE.fullmatch(result["name"]):
        raise ValueError(f"{path}: skill name must be orkestr")
    if not result["description"] or len(result["description"]) > 1024:
        raise ValueError(f"{path}: description is empty or too long")
    return result


def package_files(path: Path) -> dict[str, bytes]:
    if not path.is_dir():
        return {}
    return {
        item.relative_to(path).as_posix(): item.read_bytes()
        for item in sorted(path.rglob("*"))
        if item.is_file() and "__pycache__" not in item.parts
    }


def expected_state() -> str:
    return json.dumps(
        {
            "generated_from": "instructions/agent-skills",
            "managed_skills": ["orkestr"],
        },
        ensure_ascii=False,
        indent=2,
    ) + "\n"


def check() -> list[str]:
    errors: list[str] = []
    parse_frontmatter(SOURCE / "SKILL.md")
    if package_files(SOURCE) != package_files(TARGET):
        errors.append("adapter drift: .agents/skills/orkestr")
    if not STATE.is_file() or STATE.read_text(encoding="utf-8") != expected_state():
        errors.append("adapter state drift: .agents/skills/.snowrunnerxml-managed-skills.json")
    return errors


def sync() -> None:
    parse_frontmatter(SOURCE / "SKILL.md")
    TARGET_ROOT.mkdir(parents=True, exist_ok=True)
    if TARGET.exists():
        if TARGET.is_symlink():
            raise ValueError(f"refusing to replace a linked adapter: {TARGET}")
        resolved_target = TARGET.resolve()
        if resolved_target.parent != TARGET_ROOT.resolve() or resolved_target.name != "orkestr":
            raise ValueError(f"managed adapter path escaped its exact target: {resolved_target}")
        shutil.rmtree(resolved_target)
    shutil.copytree(SOURCE, TARGET)
    STATE.write_text(expected_state(), encoding="utf-8")


def main() -> int:
    args = parse_args()
    try:
        if args.check:
            errors = check()
            if errors:
                for error in errors:
                    print(f"ERROR: {error}")
                return 1
            print("OK: canonical orkestr skill and repository adapter are identical")
            return 0
        sync()
        print("OK: copied instructions/agent-skills/orkestr to .agents/skills/orkestr")
        return 0
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
