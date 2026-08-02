"""Decode SnowRunner PCT textures from a game PAK into PNG files.

The game stores UI truck cards in gfx.pak as a small Saber header followed by
BCn texture data.  This script intentionally reads the PAK as a ZIP archive;
it does not modify the installed game.

Runtime dependencies (kept outside the application bundle):
    python -m pip install Pillow texture2ddecoder
"""

from __future__ import annotations

import argparse
import re
import zipfile
from pathlib import Path

from PIL import Image
from texture2ddecoder import (
    decode_bc1,
    decode_bc3,
    decode_bc4,
    decode_bc5,
    decode_bc6,
    decode_bc7,
)


TRUCK_PCT = re.compile(r"trucks_img_lib_i([0-9a-f]+)\.pct$", re.IGNORECASE)
DECODERS = {
    0x0C: (decode_bc1, 8),
    0x11: (decode_bc3, 16),
    0x21: (decode_bc5, 16),
    0x24: (decode_bc5, 16),
    0x25: (decode_bc4, 8),
    0x31: (decode_bc6, 16),
    0x33: (decode_bc7, 16),
    0x34: (decode_bc7, 16),
}


def read_header(data: bytes) -> tuple[int, int, int, int]:
    width = int.from_bytes(data[16:20], "little")
    height = int.from_bytes(data[20:24], "little")
    tex_format = int.from_bytes(data[38:42], "little")
    payload_offset = int.from_bytes(data[54:58], "little")

    # Since Season 17 the PCT footer/header extension starts with 04 01 and
    # adds ten bytes before the common six-byte footer.
    if data[payload_offset : payload_offset + 2] == b"\x04\x01":
        payload_offset += 10
    payload_offset += 6
    return width, height, tex_format, payload_offset


def decode_pct(data: bytes) -> Image.Image:
    width, height, tex_format, payload_offset = read_header(data)
    decoder_info = DECODERS.get(tex_format)
    if decoder_info is None:
        raise ValueError(f"unsupported PCT texture format 0x{tex_format:02x}")

    decoder, block_size = decoder_info
    block_count = ((width + 3) // 4) * ((height + 3) // 4)
    payload_size = block_count * block_size
    raw_bgra = decoder(data[payload_offset : payload_offset + payload_size], width, height)
    return Image.frombytes("RGBA", (width, height), raw_bgra, "raw", "BGRA")


def iter_entries(pak_path: Path):
    with zipfile.ZipFile(pak_path) as archive:
        for info in archive.infolist():
            match = TRUCK_PCT.search(info.filename.replace("\\", "/"))
            if match:
                yield match.group(1).lower(), info.filename, archive.read(info)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pak", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--only", nargs="*", help="hex page ids, e.g. 1 402")
    parser.add_argument("--sheet", type=Path)
    args = parser.parse_args()

    wanted = {value.lower().removeprefix("0x") for value in args.only or []}
    args.output.mkdir(parents=True, exist_ok=True)
    images: list[tuple[str, Image.Image]] = []
    converted = 0

    for page_id, _entry_name, data in iter_entries(args.pak):
        if wanted and page_id not in wanted:
            continue
        image = decode_pct(data)
        image.save(args.output / f"trucks_img_lib_i{page_id}.png")
        images.append((page_id, image))
        converted += 1

    if args.sheet and images:
        from PIL import ImageDraw

        thumb_w, thumb_h = 164, 230
        columns = 8
        rows = (len(images) + columns - 1) // columns
        sheet = Image.new("RGB", (columns * thumb_w, rows * (thumb_h + 24)), "#202020")
        draw = ImageDraw.Draw(sheet)
        for index, (page_id, image) in enumerate(sorted(images, key=lambda item: int(item[0], 16))):
            x = (index % columns) * thumb_w
            y = (index // columns) * (thumb_h + 24)
            thumb = image.copy()
            thumb.thumbnail((thumb_w, thumb_h))
            sheet.paste(thumb.convert("RGB"), (x + (thumb_w - thumb.width) // 2, y))
            draw.text((x + 4, y + thumb_h + 4), f"i{page_id}", fill="white")
        args.sheet.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(args.sheet)

    print({"converted": converted, "output": str(args.output)})


if __name__ == "__main__":
    main()
