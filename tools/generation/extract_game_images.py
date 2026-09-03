"""Extract vehicle card images from an installed SnowRunner copy.

SnowRunner keeps the visible vehicle cards in gfx.pak as PCT textures and
keeps the shopImg -> texture-page relation in trucks_img_lib.gfx inside
gfxbundle.gfxbundle.  The relation is resolved from the XML image manifest,
so new DLC can be regenerated without hand-maintained page numbers.
"""

from __future__ import annotations

import argparse
import json
import re
import struct
import zipfile
from pathlib import Path

from pct_to_png import decode_pct


GFX_NAME = "trucks_img_lib.gfx"
GFX_ENTRY_SUFFIX = "gfxbundle.gfxbundle"
PCT_NAME = re.compile(r"trucks_img_lib_i([0-9a-f]+)\.pct$", re.IGNORECASE)
# The legacy part of trucks_img_lib.gfx stores the raster reference three
# texture ids after the PCT page used by the shop card. This was verified
# against the existing project image catalog (114 XML-linked cards). The
# Season 18 block (i400+) uses direct page ids and must not be shifted.
LEGACY_PAGE_LIMIT = 0x400
LEGACY_PAGE_OFFSET = 3
# The current game build exposes some late-DLC vehicles as class-only shop
# symbols; their raster pages are still present as late-DLC textures.
FALLBACK_TEXTURE_PAGES = {
    # Verified by decoding the PCT pages from the current retail gfx.pak.
    "shopImgMercedesBenz3850": 0x412,
    "shopImgMercerR230": 0x408,
}


def load_gfx_module(pak: zipfile.ZipFile) -> bytes:
    entry_name = next(name for name in pak.namelist() if name.endswith(GFX_ENTRY_SUFFIX))
    data = pak.read(entry_name)

    names: list[str] = []
    cursor = 20
    while cursor + 4 <= len(data):
        length = struct.unpack_from("<I", data, cursor)[0]
        if not 0 < length <= 200 or cursor + 4 + length > len(data):
            break
        name = data[cursor + 4 : cursor + 4 + length].decode("ascii", errors="ignore")
        if not re.fullmatch(r"[ -~]+", name):
            break
        names.append(name)
        cursor += 4 + length

    starts = [match.start() for match in re.finditer(b"GFX", data)]
    if len(starts) < len(names):
        raise ValueError("gfxbundle module index is incomplete")
    module_index = names.index(GFX_NAME)
    end = starts[module_index + 1] if module_index + 1 < len(starts) else len(data)
    return data[starts[module_index] : end]


def resolve_icon_pages(module: bytes, icons: set[str]) -> dict[str, int]:
    result: dict[str, int] = {}
    for icon in sorted(icons):
        name_position = module.rfind(icon.encode("ascii"))
        if name_position < 2:
            continue

        symbol_id = int.from_bytes(module[name_position - 2 : name_position], "little")
        record = module.find(
            struct.pack("<H", symbol_id) + b"\x01\x00\x86\x06\x06\x01\x00",
            0,
            name_position,
        )
        if record < 0:
            continue

        # The image definition is the first FC record in the symbol block.
        texture_record = module.find(b"\xfc", record, record + 140)
        if texture_record < 0:
            continue
        raw_page = int.from_bytes(module[texture_record + 1 : texture_record + 3], "little")
        result[icon] = (
            raw_page - LEGACY_PAGE_OFFSET
            if raw_page < LEGACY_PAGE_LIMIT
            else raw_page
        )
    return result


def load_links(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("imageLinks", data) if isinstance(data, dict) else data


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pak", type=Path, required=True)
    parser.add_argument("--links-manifest", type=Path, required=True)
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    links = load_links(args.links_manifest)
    links = [item for item in links if item.get("uiIcon") and item.get("file")]
    project_root = args.project_root.resolve()
    image_root = project_root / "src" / "images" / "trucks"
    image_root.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(args.pak) as pak:
        module = load_gfx_module(pak)
        pages = resolve_icon_pages(module, {item["uiIcon"] for item in links})
        pct_entries = {
            int(match.group(1), 16): name
            for name in pak.namelist()
            if (match := PCT_NAME.search(name.replace("\\", "/")))
        }

        report = []
        for item in links:
            icon = item["uiIcon"]
            page_id = pages.get(icon)
            if page_id not in pct_entries:
                page_id = FALLBACK_TEXTURE_PAGES.get(icon)
            entry_name = pct_entries.get(page_id) if page_id is not None else None
            destination = image_root / f"{item['file']}.png"
            row = {
                **item,
                "sourceFile": entry_name,
                "texturePage": f"i{page_id:x}" if page_id is not None else None,
                "mappingMethod": (
                    "fallback-late-dlc"
                    if icon in FALLBACK_TEXTURE_PAGES and icon not in pages
                    else "gfx-symbol-legacy-minus-3"
                    if page_id is not None and page_id < LEGACY_PAGE_LIMIT
                    else "gfx-symbol-direct"
                ),
                "copiedTo": destination.relative_to(project_root).as_posix(),
                "status": "missing",
            }
            if entry_name:
                decode_pct(pak.read(entry_name)).save(destination)
                row["status"] = "copied"
            report.append(row)

    target_report = args.report or args.links_manifest
    target_report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Keep the combined content manifest authoritative after image extraction.
    # The XML generator runs before this script, so its embedded imageLinks
    # would otherwise retain the pre-extraction missing status.
    content_manifest = project_root / "docs" / "architecture" / "generated-content-manifest.json"
    if content_manifest.exists():
        content = json.loads(content_manifest.read_text(encoding="utf-8"))
        content["imageLinks"] = report
        content_manifest.write_text(
            json.dumps(content, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(json.dumps({
        "copied": sum(item["status"] == "copied" for item in report),
        "missing": sum(item["status"] == "missing" for item in report),
        "output": str(image_root),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
