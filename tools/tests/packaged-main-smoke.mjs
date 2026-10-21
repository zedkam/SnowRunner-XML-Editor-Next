import { EventEmitter } from 'node:events'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

const scratch = await mkdtemp(join(tmpdir(), 'snowrunner-main-smoke-'))
const errors = []
const initial = process.env.SNOWRUNNER_INITIAL_PAK
const version = JSON.parse(await readFile('package.json', 'utf8')).version
const packageDirectory = process.env.SNOWRUNNER_PACKAGE_DIR || 'out/SnowRunnerXMLEditor-win32-x64'
process.on('uncaughtException', error => errors.push(error))
process.on('unhandledRejection', error => errors.push(error))
try {
  if (initial) {
    const buildDir = join(scratch, '.vite/build')
    await mkdir(join(buildDir, 'jsons'), { recursive: true })
    await mkdir(join(buildDir, 'mainTemp/[media]'), { recursive: true })
    await writeFile(join(buildDir, 'jsons/config.json'), JSON.stringify({
      version: version, initialPath: initial, buildType: 'prod', lang: 'RU', checkUpdates: false
    }))
    await writeFile(join(buildDir, 'jsons/sizes.json'), JSON.stringify({ initial: (await stat(initial)).size, mods: {} }))
  }
  const ipcMain = new EventEmitter()
  ipcMain.handle = () => {}
  ipcMain.removeHandler = () => {}
  const app = new EventEmitter()
  Object.assign(app, {
    requestSingleInstanceLock: () => true,
    getPath: () => scratch,
    getName: () => 'SnowRunner XML Editor Next test',
    getVersion: () => version,
    setAppUserModelId: () => {},
    whenReady: () => new Promise(() => {})
  })
  const electron = {
    app, ipcMain,
    shell: {}, dialog: {},
    nativeImage: { createFromPath: () => ({}) },
    BrowserWindow: class BrowserWindow {}
  }
  const runtime = Object.fromEntries(Object.getOwnPropertyNames(globalThis)
    .filter(key => key !== 'globalThis' && key !== 'global')
    .map(key => [key, globalThis[key]]))
  const context = createContext(runtime)
  context.global = context
  const file = join(packageDirectory, 'resources/app/.vite/build/index.js')
  const source = await readFile(file, 'utf8')
  const module = new SourceTextModule(source, {
    context,
    initializeImportMeta(meta) { meta.url = pathToFileURL(join(scratch, '.vite/build/index.js')).href }
  })
  await module.link(async name => {
    const imported = name === 'electron' ? electron : await import(name)
    const keys = Object.keys(imported)
    return new SyntheticModule(keys, function () {
      for (const key of keys) this.setExport(key, imported[key])
    }, { context })
  })
  let timer
  try {
    await Promise.race([
      module.evaluate({ timeout: 10000 }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Main initialization did not complete')), 10000) })
    ])
  } finally { clearTimeout(timer) }
  await new Promise(resolve => setTimeout(resolve, 300))
  if (errors.length) throw errors[0]
  console.log('Packaged main module initialized with Electron stubs; no windows opened.')
  async function call(name, args = []) {
    const channel = `FUNCTION_CALL_${name}`
    assert.ok(ipcMain.listenerCount(channel), `Missing function: ${name}`)
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout: ${name}`)), 15000)
      const finish = result => {
        clearTimeout(timer)
        result?.error ? reject(new Error(result.error)) : resolve(result?.value)
      }
      const event = { sender: { send: (_channel, result) => finish(result) } }
      ipcMain.emit(channel, event, { args, id: 1 })
      if (!event.returnValue?.promiseChannel) finish(event.returnValue)
    })
  }
  assert.equal(await call('GameBaseline/hasFile', ['wortek_250t_dlc_19']), false)
  assert.equal(await call('LocalGameImages/getSrc', ['wortek_250t', 'wrongIcon']), undefined)
  if (initial) {
    const before = createHash('sha256').update(await readFile(initial)).digest('hex')
    await call('Checks/checkInitialChanges')
    for (const [name, icon, fuel] of [
      ['wortek_250t', 'shopImgWortek250T', '600'],
      ['derry_savior', 'shopImgDerrySavior', '280']
    ]) {
      assert.equal(await call('GameBaseline/hasFile', [`${name}_dlc_19`]), true)
      const image = await call('LocalGameImages/getSrc', [name, icon])
      assert.ok(image.startsWith('data:image/png;base64,'), `${name}: no image`)
      assert.equal(await call('GameBaseline/getValue', [`${name}_dlc_19`, 'Truck > TruckData', 'FuelCapacity']), fuel)
      console.log(`${name}: packaged image and reset value available`)
    }
    assert.equal(await call('LocalGameImages/getSrc', ['wortek_250t', 'shopImgDerrySavior']), undefined)
    const after = createHash('sha256').update(await readFile(initial)).digest('hex')
    assert.equal(after, before)
    console.log('Installed game archive was read without changes.')
  }
} catch (error) {
  console.error('Headless mock initialization failed:', error)
  process.exitCode = 1
} finally {
  await rm(scratch, { recursive: true, force: true })
}
