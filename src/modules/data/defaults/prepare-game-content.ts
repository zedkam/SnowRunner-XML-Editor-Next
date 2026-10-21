import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { PakReader } from '../../archive/main/zip-reader'

const DLC_PREFIX = '[media]/_dlc/dlc_19/classes/'
export type GameSnapshot = { version: 1, files: Record<string, string> }

async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer)
  return hash.digest('hex')
}

function snapshotPath(target: string, id: string): string {
  return join(dirname(target), `${basename(target, '.json')}.snapshot.${id}.json`)
}

function bindingPath(target: string, hash: string): string {
  return join(dirname(target), `${basename(target, '.json')}.edited.${hash}.json`)
}

async function writeNew(path: string, data: string): Promise<void> {
  try {
    await writeFile(path, data, { flag: 'wx' })
  } catch (error: any) {
    if (error?.code !== 'EEXIST') throw error
    if (await readFile(path, 'utf8') !== data) throw new Error(`Invalid existing baseline file: ${path}`)
  }
}

async function storeSnapshot(target: string, snapshot: GameSnapshot): Promise<string> {
  const serialized = JSON.stringify(snapshot)
  const id = createHash('sha256').update(serialized).digest('hex')
  await mkdir(dirname(target), { recursive: true })
  await writeNew(snapshotPath(target, id), serialized)
  return id
}

/** Tie the baseline to the exact archive produced by the editor, not just its path. */
export async function rememberEditedBaseline(archive: string, target: string, snapshot: GameSnapshot): Promise<void> {
  if (!Object.keys(snapshot.files).length) return
  const id = await storeSnapshot(target, snapshot)
  const before = await stat(archive)
  const hash = await sha256File(archive)
  const after = await stat(archive)
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('Game archive changed while hashing')
  await writeNew(bindingPath(target, hash), JSON.stringify({ version: 1, id }))
}

async function readBoundSnapshot(target: string, archiveHash: string): Promise<GameSnapshot | undefined> {
  try {
    const binding = JSON.parse(await readFile(bindingPath(target, archiveHash), 'utf8')) as { version: number, id: string }
    if (binding.version !== 1 || !/^[a-f0-9]{64}$/.test(binding.id)) return
    const serialized = await readFile(snapshotPath(target, binding.id), 'utf8')
    if (createHash('sha256').update(serialized).digest('hex') !== binding.id) return
    const saved = JSON.parse(serialized) as GameSnapshot
    return saved.version === 1 && saved.files && typeof saved.files === 'object' ? saved : undefined
  } catch {
    // A missing or interrupted write is not a valid reset baseline.
    return undefined
  }
}

/** Supplement the unpacked files without overwriting edits; retain a local baseline. */
export async function prepareGameContent(archive: string, dlcFolder: string, target: string): Promise<GameSnapshot> {
  const empty: GameSnapshot = { version: 1, files: {} }
  const before = await stat(archive)
  const pak = await PakReader.open(archive)
  try {
    const entries = pak.entries.filter(entry => entry.name.startsWith(DLC_PREFIX) && entry.name.endsWith('.xml'))
    const edited = Boolean(pak.find('edited'))
    const files: Record<string, string> = {}
    for (const entry of entries) {
      const relative = entry.name.slice(DLC_PREFIX.length)
      if (!/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(relative) || relative.split('/').some(part => part === '..')) {
        throw new Error(`Unsafe game archive path: ${entry.name}`)
      }
      const content = await pak.read(entry)
      const destination = join(dlcFolder, 'dlc_19', 'classes', ...relative.split('/'))
      await mkdir(dirname(destination), { recursive: true })
      try {
        await writeFile(destination, content, { flag: 'wx' })
      } catch (error: any) {
        if (error?.code !== 'EEXIST') throw error
      }
      if (!edited) {
        const name = `${basename(relative, '.xml')}_dlc_19`
        if (Object.hasOwn(files, name)) throw new Error(`Ambiguous DLC baseline: ${name}`)
        files[name] = content.toString('utf8')
      }
    }
    if (edited) {
      // Reuse only a baseline bound to these exact edited PAK bytes.
      const hash = await sha256File(archive)
      const after = await stat(archive)
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('Game archive changed while reading')
      return await readBoundSnapshot(target, hash) ?? empty
    }
    if (!entries.length) return empty
    const snapshot: GameSnapshot = { version: 1, files }
    const after = await stat(archive)
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('Game archive changed while reading')
    await storeSnapshot(target, snapshot)
    return snapshot
  } finally {
    await pak.close()
  }
}
