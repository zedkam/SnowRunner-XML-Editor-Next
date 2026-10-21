import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { deflateRawSync, inflateSync } from 'node:zlib'
import { build } from 'esbuild'
import { load } from 'cheerio'

async function importSource(path) {
  const result = await build({ entryPoints: [path], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}

const { PakReader } = await importSource('src/modules/archive/main/zip-reader.ts')
const { prepareGameContent, rememberEditedBaseline } = await importSource('src/modules/data/defaults/prepare-game-content.ts')
const { decodeBC1Pct } = await importSource('src/modules/images/pct-bc1.ts')
const { encodePng } = await importSource('src/modules/images/png.ts')
const { verifiedCards } = await importSource('src/modules/images/verified-cards.ts')

// Minimal synthetic ZIP; CRC is not needed by this read-only ZIP reader.
function zip(entries) {
  const locals = []
  const central = []
  let offset = 0
  for (const [name, text, method = 8] of entries) {
    const filename = Buffer.from(name)
    const value = Buffer.from(text)
    const compressed = method ? deflateRawSync(value) : value
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(value.length, 22)
    local.writeUInt16LE(filename.length, 26)
    const record = Buffer.concat([local, filename, compressed])
    locals.push(record)
    const cd = Buffer.alloc(46)
    cd.writeUInt32LE(0x02014b50, 0)
    cd.writeUInt16LE(method, 10)
    cd.writeUInt32LE(compressed.length, 20)
    cd.writeUInt32LE(value.length, 24)
    cd.writeUInt16LE(filename.length, 28)
    cd.writeUInt32LE(offset, 42)
    central.push(Buffer.concat([cd, filename]))
    offset += record.length
  }
  const directory = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end, Buffer.alloc(137)])
}

async function inTemp(callback) {
  const folder = await mkdtemp(join(tmpdir(), 'snowrunner-dlc19-test-'))
  try { await callback(folder) } finally { await rm(folder, { recursive: true, force: true }) }
}

test('read padded ZIP and preserve user-edited files and safe baseline', async () => inTemp(async folder => {
  const archive = join(folder, 'initial.pak')
  const xmlName = '[media]/_dlc/dlc_19/classes/trucks/example.xml'
  const original = '<Truck><TruckData FuelCapacity="280" /></Truck>'
  await writeFile(archive, zip([[xmlName, original], ['plain.txt', 'stored', 0]]))
  const before = createHash('sha256').update(await readFile(archive)).digest('hex')
  const out = join(folder, 'unpacked')
  const snapshotFile = join(folder, 'baseline.json')
  const current = join(out, 'dlc_19/classes/trucks/example.xml')
  await mkdir(dirname(current), { recursive: true })
  await writeFile(current, 'user edit')
  const baseline = await prepareGameContent(archive, out, snapshotFile)
  assert.equal(await readFile(current, 'utf8'), 'user edit')
  assert.equal(baseline.files.example_dlc_19, original)
  const pak = await PakReader.open(archive)
  try { assert.equal((await pak.read(pak.find('plain.txt'))).toString(), 'stored') } finally { await pak.close() }
  assert.equal(createHash('sha256').update(await readFile(archive)).digest('hex'), before)
  await prepareGameContent(archive, out, snapshotFile) // identical baseline is not duplicated
  await writeFile(archive, zip([[xmlName, 'already edited'], ['edited', '']]))
  assert.deepEqual((await prepareGameContent(archive, out, snapshotFile)).files, {})
  await rememberEditedBaseline(archive, snapshotFile, baseline)
  assert.equal((await prepareGameContent(archive, out, snapshotFile)).files.example_dlc_19, original)
  assert.deepEqual((await prepareGameContent(archive, out, join(folder, 'missing.json'))).files, {})
  await writeFile(archive, zip([[xmlName, 'edited elsewhere'], ['edited', '']]))
  assert.deepEqual((await prepareGameContent(archive, out, snapshotFile)).files, {})
}))

test('reject unsafe DLC entry paths', async () => inTemp(async folder => {
  const archive = join(folder, 'unsafe.pak')
  await writeFile(archive, zip([['[media]/_dlc/dlc_19/classes/../../escape.xml', 'bad']]))
  await assert.rejects(prepareGameContent(archive, join(folder, 'out'), join(folder, 'snapshot.json')), /Unsafe/)
}))

test('BC1 decoding and PNG pixel channel order', () => {
  const data = Buffer.alloc(74)
  data.writeUInt32LE(4, 16)
  data.writeUInt32LE(4, 20)
  data.writeUInt32LE(0x0c, 38)
  data.writeUInt32LE(60, 54)
  data.writeUInt16LE(0xf800, 66) // red in RGB565
  data.writeUInt16LE(0x07e0, 68) // green
  const { width, height, bgra } = decodeBC1Pct(data)
  assert.deepEqual([...bgra.subarray(0, 4)], [0, 0, 255, 255])
  const png = encodePng(width, height, bgra)
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  const idat = png.indexOf('IDAT')
  const rows = inflateSync(png.subarray(idat + 4, idat + 4 + png.readUInt32BE(idat - 4)))
  assert.deepEqual([...rows.subarray(1, 5)], [255, 0, 0, 255])
  assert.throws(() => decodeBC1Pct(data.subarray(0, 68)))
})

const initial = process.env.SNOWRUNNER_INITIAL_PAK
const gfx = process.env.SNOWRUNNER_GFX_PAK
if (initial && gfx) {
  test('local game: new vehicles, Russian and English texts, images and unchanged source', async () => inTemp(async folder => {
    const initialHash = createHash('sha256').update(await readFile(initial)).digest('hex')
    const snapshot = await prepareGameContent(initial, join(folder, 'unpacked'), join(folder, 'baseline.json'))
    assert.equal(Object.keys(snapshot.files).length, 72)
    assert.match(snapshot.files.wortek_250t_dlc_19, /FuelCapacity="600"/)
    assert.match(snapshot.files.derry_savior_dlc_19, /FuelCapacity="280"/)
    assert.equal(load(snapshot.files.wortek_250t_dlc_19, { xml: true })('Truck > TruckData').attr('FuelCapacity'), '600')
    assert.equal(load(snapshot.files.derry_savior_dlc_19, { xml: true })('Truck > TruckData').attr('FuelCapacity'), '280')
    const source = await PakReader.open(initial)
    try {
      for (const lang of ['russian', 'english']) {
        const text = (await source.read(source.find(`[strings]/strings_${lang}.str`))).toString('utf16le')
        for (const key of ['UI_VEHICLE_WORTEK_250T_DESC', 'UI_VEHICLE_DERRY_SAVIOR_DESC']) {
          const line = text.split(/\r?\n/).find(row => row.startsWith(key))
          assert.ok(line && line.split('"')[1]?.length > 0, `${lang}: ${key}`)
        }
      }
      for (const name of ['double1', 'double2', 'allterrain_double', 'highway_double', 'offroad_double']) {
        assert.ok(source.find(`[media]/_dlc/dlc_16_5/classes/wheels/wheels_heavy_${name}_avenhorn_a15.xml`))
      }
    } finally { await source.close() }
    const pictures = await PakReader.open(gfx)
    try {
      const expectedPixels = {
        wortek_250t: '5af55d0b57d0d81d3bbeff6e6c2bc3a583af2a3f670f47ef936ec1c439e6d4be',
        derry_savior: 'd59d73a1937dc50306931699f186a7dadbddf6db5e469dee25d8a036f89dafc5',
        mercedes_3850: 'bf276ca1b6e99af5fb1c037dc4cc5dbf69de48c13664a483a4f465df747bce5f',
        mercedes_mamute_1519: '59ce92817c702c2e689a4fa19bb02f09853239c4be7d753e024b56f1addba384'
      }
      for (const [name, card] of Object.entries(verifiedCards)) {
        const data = await pictures.read(pictures.find(`[textures]/ui/flash_auto/trucks_img_lib_i${card.page}.pct`))
        assert.equal(createHash('sha256').update(data).digest('hex'), card.sha256)
        const bitmap = decodeBC1Pct(data)
        assert.equal(bitmap.width, 328)
        assert.equal(bitmap.height, 460)
        assert.equal(createHash('sha256').update(bitmap.bgra).digest('hex'), expectedPixels[name])
        assert.ok(encodePng(bitmap.width, bitmap.height, bitmap.bgra).length > 1000)
      }
    } finally { await pictures.close() }
    assert.equal(createHash('sha256').update(await readFile(initial)).digest('hex'), initialHash)
  }))
}
