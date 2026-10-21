/** XML icon -> PCT page, verified against the local game's GFX symbol library.
 * A hash mismatch must produce a placeholder, never an assumed image.
 */
export const verifiedCards: Record<string, { icon: string, page: string, sha256: string }> = {
  'wortek_250t': { icon: 'shopImgWortek250T', page: '1f', sha256: '648261118376d80df934ae74fcbeeb65c7ecad6daa37235644ddafc8c697cf3d' },
  'derry_savior': { icon: 'shopImgDerrySavior', page: '118', sha256: 'bc59f40e9a3ba3b28c04428a739bde90e133bb26fce9b1fe75b4989a7a3b285a' },
  'mercedes_3850': { icon: 'shopImgMercedesBenz3850', page: '97', sha256: '76b7aaf91dcefdb2918c8e20a290a06e887e4fabdbb82e8a966fd6a1f107732c' },
  'mercedes_mamute_1519': { icon: 'shopImgMercedesBenzMamute', page: '91', sha256: '5d088d2f45645108cb3f757e5e01af9f00026ff1cfbdedec77606f128fc9f7a7' }
}
