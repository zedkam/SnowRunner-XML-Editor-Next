import { open } from 'node:fs/promises'
import type { FileHandle } from 'node:fs/promises'
import { inflateRawSync } from 'node:zlib'

/** A bounded, read-only reader for the ordinary ZIP archives used by SnowRunner. */
export interface PakEntry {
  name: string
  offset: number
  compressedSize: number
  size: number
  method: number
  flags: number
}

export class PakReader {
  private readonly handle: FileHandle
  readonly entries: PakEntry[]

  private constructor(handle: FileHandle, entries: PakEntry[]) {
    this.handle = handle
    this.entries = entries
  }

  static async open(path: string): Promise<PakReader> {
    const handle = await open(path, 'r')
    try {
      const { size } = await handle.stat()
      const tailSize = Math.min(size, 65_557)
      const tail = await readExact(handle, size - tailSize, tailSize)
      let end = -1
      for (let i = tail.length - 22; i >= 0; i--) {
        const endOfRecord = i + 22 + tail.readUInt16LE(i + 20)
        // SnowRunner pads PAK files with zero bytes after the ZIP directory.
        if (tail.readUInt32LE(i) === 0x06054b50 && endOfRecord <= tail.length &&
            tail.subarray(endOfRecord).every(byte => byte === 0)) {
          end = i
          break
        }
      }
      if (end < 0) throw new Error('ZIP directory not found')
      const count = tail.readUInt16LE(end + 10)
      const length = tail.readUInt32LE(end + 12)
      const start = tail.readUInt32LE(end + 16)
      if (tail.readUInt16LE(end + 4) || tail.readUInt16LE(end + 6) || count === 0xffff ||
          length === 0xffffffff || start === 0xffffffff || length > 32 * 1024 * 1024 || start + length > size) {
        throw new Error('Unsupported ZIP directory')
      }
      const directory = await readExact(handle, start, length)
      const entries: PakEntry[] = []
      let at = 0
      for (let i = 0; i < count; i++) {
        if (at + 46 > directory.length || directory.readUInt32LE(at) !== 0x02014b50) {
          throw new Error('Invalid ZIP directory entry')
        }
        const nameLength = directory.readUInt16LE(at + 28)
        const extraLength = directory.readUInt16LE(at + 30)
        const commentLength = directory.readUInt16LE(at + 32)
        const next = at + 46 + nameLength + extraLength + commentLength
        if (next > directory.length) throw new Error('Truncated ZIP directory entry')
        entries.push({
          name: directory.subarray(at + 46, at + 46 + nameLength).toString('utf8').replaceAll('\\', '/'),
          flags: directory.readUInt16LE(at + 8),
          method: directory.readUInt16LE(at + 10),
          compressedSize: directory.readUInt32LE(at + 20),
          size: directory.readUInt32LE(at + 24),
          offset: directory.readUInt32LE(at + 42)
        })
        at = next
      }
      return new PakReader(handle, entries)
    } catch (error) {
      await handle.close()
      throw error
    }
  }

  find(name: string): PakEntry | undefined {
    const matches = this.entries.filter(entry => entry.name === name)
    if (matches.length > 1) throw new Error(`Ambiguous ZIP entry: ${name}`)
    return matches[0]
  }

  async read(entry: PakEntry, maxSize = 8 * 1024 * 1024): Promise<Buffer> {
    if (entry.flags & 1 || ![0, 8].includes(entry.method) || entry.size > maxSize || entry.compressedSize > maxSize) {
      throw new Error(`Unsupported ZIP entry: ${entry.name}`)
    }
    const header = await readExact(this.handle, entry.offset, 30)
    if (header.readUInt32LE(0) !== 0x04034b50) throw new Error(`Invalid ZIP header: ${entry.name}`)
    const offset = entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28)
    const compressed = await readExact(this.handle, offset, entry.compressedSize)
    const result = entry.method === 0 ? compressed : inflateRawSync(compressed, { maxOutputLength: maxSize })
    if (result.length !== entry.size) throw new Error(`Invalid ZIP entry size: ${entry.name}`)
    return result
  }

  async close(): Promise<void> {
    await this.handle.close()
  }
}

async function readExact(handle: FileHandle, position: number, length: number): Promise<Buffer> {
  const buffer = Buffer.alloc(length)
  let read = 0
  while (read < length) {
    const result = await handle.read(buffer, read, length - read, position + read)
    if (!result.bytesRead) throw new Error('Unexpected end of ZIP archive')
    read += result.bytesRead
  }
  return buffer
}
