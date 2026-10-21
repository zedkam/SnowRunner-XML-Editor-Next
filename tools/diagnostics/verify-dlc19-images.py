"""Read-only cross-check of XML icon IDs, GFX symbols and existing image pixels."""
from __future__ import annotations

import argparse
import hashlib
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'generation'))
from extract_game_images import load_gfx_module, resolve_icon_pages  # noqa: E402
from pct_to_png import decode_pct  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--initial', type=Path, required=True)
    parser.add_argument('--gfx', type=Path, required=True)
    parser.add_argument('--project-root', type=Path, default=Path.cwd())
    args = parser.parse_args()
    cards = {
        'wortek_250t': ('dlc_19', 'shopImgWortek250T', 0x1f, '648261118376d80df934ae74fcbeeb65c7ecad6daa37235644ddafc8c697cf3d', None),
        'derry_savior': ('dlc_19', 'shopImgDerrySavior', 0x118, 'bc59f40e9a3ba3b28c04428a739bde90e133bb26fce9b1fe75b4989a7a3b285a', None),
        'mercedes_3850': ('dlc_18_1', 'shopImgMercedesBenz3850', 0x97, '76b7aaf91dcefdb2918c8e20a290a06e887e4fabdbb82e8a966fd6a1f107732c', 'mercedes_mamute_1519.png'),
        'mercedes_mamute_1519': ('dlc_18_1', 'shopImgMercedesBenzMamute', 0x91, '5d088d2f45645108cb3f757e5e01af9f00026ff1cfbdedec77606f128fc9f7a7', 'mercedes_3850.png'),
    }
    with zipfile.ZipFile(args.initial) as initial, zipfile.ZipFile(args.gfx) as gfx:
        module = load_gfx_module(gfx)
        pages = resolve_icon_pages(module, {value[1] for value in cards.values()})
        for name, (dlc, icon, page, sha, existing) in cards.items():
            entry = f'[media]/_dlc/{dlc}/classes/trucks/{name}.xml'
            xml = initial.read(entry).decode('utf-8-sig')
            root = ElementTree.fromstring(f'<root>{xml}</root>')
            node = root.find('./Truck/GameData/UiDesc')
            assert node is not None and node.get('UiIcon328x458') == icon, name
            assert pages.get(icon) == page, (name, pages.get(icon), page)
            texture = gfx.read(f'[textures]/ui/flash_auto/trucks_img_lib_i{page:x}.pct')
            assert hashlib.sha256(texture).hexdigest() == sha, name
            if existing:
                with Image.open(args.project_root / 'src/images/trucks' / existing) as image:
                    assert image.convert('RGBA').tobytes() == decode_pct(texture).tobytes(), name
            print(f'{name}: XML {icon} -> GFX i{page:x}; SHA-256 and pixels verified')


if __name__ == '__main__':
    main()
