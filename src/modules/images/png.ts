import { deflateSync } from 'node:zlib'

/** Encode BGRA pixels as PNG without native dependencies or game assets. */
export function encodePng(width: number, height: number, bgra: Buffer): Buffer {
  if (!width || !height || bgra.length !== width * height * 4) throw new Error('Invalid bitmap')
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  const rows = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4
      const target = y * (width * 4 + 1) + 1 + x * 4
      rows[target] = bgra[source + 2]
      rows[target + 1] = bgra[source + 1]
      rows[target + 2] = bgra[source]
      rows[target + 3] = bgra[source + 3]
    }
  }
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function chunk(name: string, data: Buffer): Buffer {
  const type = Buffer.from(name, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  let crc = 0xffffffff
  for (const byte of Buffer.concat([type, data])) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
  return Buffer.concat([length, type, data, checksum])
}
