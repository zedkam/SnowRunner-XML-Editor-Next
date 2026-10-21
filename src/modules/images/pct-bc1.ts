/** Decode the BC1 PCT cards used by the explicitly verified game images. */
export function decodeBC1Pct(data: Buffer): { width: number, height: number, bgra: Buffer } {
  if (data.length < 64) throw new Error('Truncated PCT header')
  const width = data.readUInt32LE(16)
  const height = data.readUInt32LE(20)
  const format = data.readUInt32LE(38)
  let start = data.readUInt32LE(54)
  if (data[start] === 4 && data[start + 1] === 1) start += 10
  start += 6
  const columns = Math.ceil(width / 4)
  const rows = Math.ceil(height / 4)
  if (format !== 0x0c || !width || !height || width > 2048 || height > 2048 || start + columns * rows * 8 > data.length) {
    throw new Error('Unsupported or truncated PCT image')
  }
  const bgra = Buffer.alloc(width * height * 4)
  const color = (v: number): number[] => {
    const r = (v >> 11) & 31
    const g = (v >> 5) & 63
    const b = v & 31
    return [(b << 3) | (b >> 2), (g << 2) | (g >> 4), (r << 3) | (r >> 2), 255]
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const at = start + (y * columns + x) * 8
      const a = data.readUInt16LE(at)
      const b = data.readUInt16LE(at + 2)
      const first = color(a)
      const second = color(b)
      const mix = (left: number, right: number, divisor: number) => [0, 1, 2].map(i => Math.floor((first[i] * left + second[i] * right) / divisor)).concat(255)
      const colors = a > b
        ? [first, second, mix(2, 1, 3), mix(1, 2, 3)]
        : [first, second, mix(1, 1, 2), [0, 0, 0, 0]]
      const indexes = data.readUInt32LE(at + 4)
      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          const actualX = x * 4 + px
          const actualY = y * 4 + py
          if (actualX >= width || actualY >= height) continue
          const index = (indexes >>> ((py * 4 + px) * 2)) & 3
          const output = (actualY * width + actualX) * 4
          for (let c = 0; c < 4; c++) bgra[output + c] = colors[index][c]
        }
      }
    }
  }
  return { width, height, bgra }
}
