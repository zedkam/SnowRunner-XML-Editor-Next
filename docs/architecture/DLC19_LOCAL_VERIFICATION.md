# DLC 19: local game verification

The editor reads game data from the user's installed PAK files. No new game
XML or texture is included in this release. This report records identifiers
and hashes, not the copyrighted assets.

The inspected `initial.pak` contained 12,171 entries and SHA-256
`f955389930c813913e809e2d2baddde756ca097808efbc3e1a65630422ea75a5`.
All 72 XML files in `dlc_19` passed the strict fragment check. Both new trucks
passed the in-memory XML round-trip check. Russian and English description
keys exist in the corresponding local game strings.

| XML file | XML UiIcon328x458 | GFX texture page | PCT SHA-256 |
| --- | --- | --- | --- |
| `wortek_250t.xml` | `shopImgWortek250T` | `i1f` | `648261118376d80df934ae74fcbeeb65c7ecad6daa37235644ddafc8c697cf3d` |
| `derry_savior.xml` | `shopImgDerrySavior` | `i118` | `bc59f40e9a3ba3b28c04428a739bde90e133bb26fce9b1fe75b4989a7a3b285a` |
| `mercedes_3850.xml` | `shopImgMercedesBenz3850` | `i97` | `76b7aaf91dcefdb2918c8e20a290a06e887e4fabdbb82e8a966fd6a1f107732c` |
| `mercedes_mamute_1519.xml` | `shopImgMercedesBenzMamute` | `i91` | `5d088d2f45645108cb3f757e5e01af9f00026ff1cfbdedec77606f128fc9f7a7` |

The XML icon-to-page relation was resolved from the installed game's
`trucks_img_lib.gfx`. The decoded Mercedes pages match the two existing project
PNGs exactly, but the filenames were reversed in beta.4. The runtime resolves
that reversal without replacing these source files. The older generated image
manifest records a previous snapshot and must not be treated as the corrected
Mercedes mapping for this version.

The PCT decoder was compared pixel-for-pixel with the existing independent
Python decoder. A different PCT hash is rejected rather than guessed; users of
a different game build may see a placeholder until the mapping is verified.
This does not assert that all other legacy project images were re-audited.

The DLC 19 baseline is stored locally when the PAK has no editor `edited` marker.
It is a snapshot of that local archive, not independent proof of pristine game
data. After an editor save, the snapshot is tied to the exact edited archive's
SHA-256. If an archive is marked edited and no matching binding exists, the
editor does not invent reset values. Existing extracted XML is never overwritten
by the new supplementary extraction.

Checks:

- `npm run check` and `npm run test:dlc19`;
- `tools/diagnostics/validate-dlc-xml.ps1` for `dlc_19`;
- `tools/generation/roundtrip-test.ps1` for both new truck XML files;
- `tools/diagnostics/verify-dlc19-images.py` against the local `initial.pak` and `gfx.pak`;
- the optional real-game part of `tools/tests/dlc19.test.mjs`, with
  `SNOWRUNNER_INITIAL_PAK` and `SNOWRUNNER_GFX_PAK` set to the local archives.

These checks do not replace a user-visible application or in-game acceptance test.
