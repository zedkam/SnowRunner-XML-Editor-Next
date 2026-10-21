import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { test } from 'node:test'
import { build } from 'esbuild'

// Execute the real component action code with its dependencies supplied as
// simple objects. No browser, windows or game writes are involved.
async function actionScript(path, modules, macros) {
  const text = await readFile(path, 'utf8')
  const contents = path.endsWith('.vue') ? text.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1] : text
  const key = `reset_test_${randomUUID().replaceAll('-', '')}`
  globalThis[key] = { modules, macros }
  try {
    const prelude = 'const { defineProps, defineExpose, defineEmits, defineSlots } = __resetDependencies.macros;\n'
    const result = await build({
      stdin: { contents: prelude + contents, loader: 'ts', resolveDir: dirname(path), sourcefile: path },
      bundle: true, platform: 'node', format: 'esm', write: false,
      banner: { js: `const __resetDependencies = globalThis.${key};` },
      plugins: [{
        name: 'action-dependencies',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, args => ({ path: args.path, namespace: 'stub' }))
          builder.onLoad({ filter: /.*/, namespace: 'stub' }, args => {
            const module = modules[args.path]
            if (!module) throw new Error(`Missing dependency: ${args.path}`)
            return { contents: Object.keys(module).map(name => name === 'default'
              ? `export default __resetDependencies.modules[${JSON.stringify(args.path)}].default;`
              : `export const ${name} = __resetDependencies.modules[${JSON.stringify(args.path)}][${JSON.stringify(name)}];`).join('\n') }
          })
        }
      }]
    })
    return await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
  } finally { delete globalThis[key] }
}

const ref = value => ({ value })
const file = { name: 'wortek_250t', path: 'local/dlc_19/wortek_250t.xml' }
const info = { value: { dlc: 'dlc_19' } }
const basicVue = { ref, shallowRef: ref, computed: fn => ({ get value() { return fn() } }), toRefs: value => Object.fromEntries(Object.entries(value).map(([k, v]) => [k, ref(v)])), onMounted() {}, onUnmounted() {}, inject() {}, provide() {}, nextTick: async () => {}, h: () => ({}) }

test('DLC 19 reset checks for originals while opening the editor remains possible', async () => {
  let available = false
  const { default: reset } = await actionScript('src/renderer/pages/general/editor/utils/reset.ts', {
    vue: basicVue, '../texts': { default: { resetUnavailable: 'Исходные параметры не сохранены' } },
    './import': { default: { getName: (file, dlc) => `${file.name}_${dlc}` } },
    '/mods/data/defaults/game-baseline-renderer': { default: { hasFile: async () => available, getValue: async () => undefined } },
    '/mods/data/defaults/renderer': { default: {} }
  }, {})
  assert.equal(await reset.getDefaultValue(file, info.value, { selector: 'Truck > TruckData', name: 'FuelCapacity' }), undefined)
  await assert.rejects(reset.ensureAvailable(file, info.value), /Исходные параметры/)
  await reset.ensureAvailable(file, { dlc: 'dlc_18_1' })
  available = true
  await reset.ensureAvailable({ ...file, path: 'another-install/wortek_250t.xml' }, info.value)
})

test('missing originals stop reset before any edit or success message', async () => {
  const events = []
  let exposed
  let unavailable = true
  const resetUtils = { globalID: 0, ensureAvailable: async () => { if (unavailable) throw new Error('Нет исходных параметров') }, emit: async () => events.push('reset') }
  const store = { showMessages: ref(true), info, editedAction: ref('edited'), setIsSaving() {}, setEditedAction: action => events.push(action) }
  await actionScript('src/renderer/pages/general/editor/components/header/main-header.vue', {
    '@ant-design/icons-vue': Object.fromEntries(['ExportOutlined','ImportOutlined','MenuFoldOutlined','MenuUnfoldOutlined','SaveOutlined','UndoOutlined'].map(k => [k, {}])),
    'ant-design-vue': { Button: {}, Dropdown: {}, Menu: {}, Modal: {}, Typography: { Text: {} } },
    pinia: { storeToRefs: value => value }, vue: basicVue,
    '../../../store': { EditedAction: { markAsNotEdited: 'not-edited' }, useEditorStore: () => store, usePageStore: () => ({ route() {} }) },
    '../../texts': { default: { successReset: 'Сброшено' } },
    '../../utils': { ResetUtils: resetUtils, SaveUtils: {}, ImportUtils: {}, ExportUtils: {} },
    '../files-menu': { default: {} },
    '/mods/renderer': { Archive: {}, Config: {}, Edited: {}, File: class { get name() { return file.name } }, GameTexts: {}, Messages: { error: error => events.push(error.message), success: () => events.push('success') }, Mods: { findByFile() {} }, Page: {}, TruckFileType: {} },
    '/rend/components': { Header: {} }, '/utils/renderer': { lastItem: values => values.at(-1), prettyString: value => value }
  }, { defineProps: () => ({ file, xml: {} }), defineExpose: value => { exposed = value } })
  assert.equal(await exposed.reset(), false)
  assert.deepEqual(events, ['Нет исходных параметров'])
  unavailable = false
  events.length = 0
  assert.equal(await exposed.reset(), true)
  assert.deepEqual(events, ['reset', 'not-edited', 'success'])
})

test('failed reset does not automatically save the archive', async () => {
  let exposed
  let success = false
  let saves = 0
  const header = { reset: async () => success, save: async () => { saves++ } }
  let refs = 0
  const vue = { ...basicVue, ref: value => ++refs === 1 ? { value: header } : ref(value) }
  await actionScript('src/renderer/pages/general/editor/index.vue', {
    pinia: { storeToRefs: () => ({ file: ref(file), allFiles: ref({}) }) }, vue,
    '../store': { useEditorStore: () => ({ setInfo() {} }), usePageStore: () => ({ route() {} }) },
    './components': { Header: {}, Table: {} },
    './utils': { FilesUtils: { watch() {} }, ResetUtils: { provide() {}, globalID: 0 }, provideFile() {} },
    '/mods/renderer': { DLCs: { getDLC: () => 'dlc_19' }, Dirs: { backupInitialData: { name: 'previous_initial' } }, Mods: { getModID() {} }, Page: {}, TruckXML: {} },
    '/rend/components': { Spin: {} }, '/rend/utils': { useKey() {} }
  }, { defineProps: () => ({ file }), defineExpose: value => { exposed = value }, defineEmits: () => () => {} })
  await exposed.reset()
  assert.equal(saves, 0)
  success = true
  await exposed.reset()
  assert.equal(saves, 1)
})

test('a parameter with original value zero is restored to zero', async () => {
  let onReset
  let current = 7
  const descriptor = { label: 'Value', get: () => current, set: v => { current = v }, setStr: v => { current = v } }
  await actionScript('src/renderer/pages/general/editor/components/parameter.vue', {
    'ant-design-vue': { Popover: {}, Typography: { Text: {} } }, pinia: { storeToRefs: () => ({ info }) }, vue: basicVue,
    '../../store': { useEditorStore: () => ({}) }, '../texts': { default: {} },
    '../utils': { ResetUtils: { onReset: handler => { onReset = handler }, ensureAvailable: async () => {}, getDefaultValue: async () => 0 }, ImportUtils: { onImport() {} }, ExportUtils: { onExport() {} } },
    '../utils/import': { injectFile: () => file }, './utils': { useActive: () => ({ isActive: ref(true) }) },
    '/mods/renderer': { Config: {}, Lang: { ch: 'CH' }, Messages: { error() {} } },
    '/rend/components': { ContextMenu: {}, Wrap: {} }, '/utils/renderer': { isString: value => typeof value === 'string', isNullable: value => value == null }
  }, { defineProps: () => ({ descriptor, label: undefined, desc: undefined }), defineEmits: () => () => {}, defineSlots: () => ({}) })
  await onReset()
  assert.equal(current, 0)
})
