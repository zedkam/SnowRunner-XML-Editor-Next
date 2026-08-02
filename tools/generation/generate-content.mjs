import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import * as cheerio from 'cheerio'

const args = parseArgs(process.argv.slice(2))
const inputRoot = path.resolve(args['input-root'])
const projectRoot = path.resolve(args['project-root'])
const sources = (args.sources ?? 'dlc_15_5,dlc_16,dlc_16_5,dlc_17,dlc_17_5,dlc_18')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)

const defaults = {}
const collisions = []
const imageLinks = []
const sourceStats = []
const fileNames = []

for (const source of sources) {
  const sourceRoot = path.join(inputRoot, '_dlc', source, 'classes')
  const files = await findFiles(sourceRoot, '.xml')
  let truckCount = 0

  for (const filePath of files) {
    const relative = path.relative(inputRoot, filePath).replaceAll(path.sep, '/')
    const content = await fs.readFile(filePath, 'utf8')
    const $ = loadGameXml(content)
    const fileName = path.basename(filePath, '.xml')
    const key = `${fileName}_${source}`
    const values = collectDefaults($)

    if (defaults[key]) {
      collisions.push({ key, source, path: relative })
      defaults[key] = mergeDefaults(defaults[key], values)
    } else {
      defaults[key] = values
    }

    fileNames.push({ source, path: relative, key })

    if (relative.startsWith(`_dlc/${source}/classes/trucks/`) &&
      !relative.slice(`_dlc/${source}/classes/trucks/`.length).includes('/')) {
      truckCount++
      imageLinks.push(await inspectImageLink({
        $, source, filePath, fileName, relative, inputRoot, projectRoot
      }))
    }
  }

  sourceStats.push({ source, files: files.length, trucks: truckCount })
}

await writeDefaults(projectRoot, defaults)
await writeJson(path.join(projectRoot, 'docs', 'architecture', 'generated-image-links.json'), imageLinks)
await writeJson(path.join(projectRoot, 'docs', 'architecture', 'generated-content-manifest.json'), {
  schema: 1,
  generatedAt: new Date().toISOString(),
  archive: args.archive ?? null,
  sources: sourceStats,
  files: fileNames,
  collisions,
  imageLinks
})

console.log(JSON.stringify({
  sources: sourceStats,
  defaultEntries: Object.keys(defaults).length,
  collisions: collisions.length,
  imageLinks: imageLinks.length,
  imageFilesCopied: imageLinks.filter(item => item.status === 'copied').length,
  imageFilesFound: imageLinks.filter(item => item.status === 'found').length,
  imageFilesMissing: imageLinks.filter(item => item.status === 'missing').length
}, null, 2))

function parseArgs(values) {
  const result = {}
  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    if (!value.startsWith('--')) continue
    const key = value.slice(2)
    result[key] = values[index + 1]?.startsWith('--') ? true : values[++index]
  }
  return result
}

async function findFiles(root, extension) {
  const result = []
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      result.push(...await findFiles(fullPath, extension))
    } else if (entry.name.toLowerCase().endsWith(extension)) {
      result.push(fullPath)
    }
  }
  return result.sort((left, right) => left.localeCompare(right))
}

function loadGameXml(content) {
  const withoutDeclaration = content.replace(/<\?xml\s+[^>]*\?>/gi, '')
  return cheerio.load(`<__sxmle_root>${withoutDeclaration}</__sxmle_root>`, {
    xmlMode: true,
    decodeEntities: false
  })
}

function collectDefaults($) {
  const result = {}
  $('__sxmle_root > *').each((_, root) => {
    if (root.type !== 'tag' || root.name.startsWith('_')) return
    $(root).find('*').addBack().each((__, element) => {
      if (element.type !== 'tag' || element.name.startsWith('_')) return
      const attributes = element.attribs ?? {}
      const names = Object.keys(attributes).filter(name => !name.startsWith('_'))
      if (!names.length) return
      const selector = selectorFor($, element)
      result[selector] ??= {}
      for (const name of names) {
        result[selector][name] = String(attributes[name])
      }
    })
  })
  return result
}

function selectorFor($, element) {
  const parts = []
  let current = element
  while (current?.type === 'tag' && current.name !== '__sxmle_root') {
    let part = current.name
    const siblings = $(current.parent).children(current.name).toArray()
    if (siblings.length > 1) {
      part += `:nth-of-type(${siblings.indexOf(current) + 1})`
    }
    parts.unshift(part)
    current = current.parent
  }
  return parts.join(' > ')
}

async function inspectImageLink({ $, source, filePath, fileName, relative, inputRoot, projectRoot }) {
  const truckImage = $('TruckData').first().attr('TruckImage') ?? null
  const uiIcon = $('GameData > UiDesc').first().attr('UiIcon328x458') ?? null
  const found = uiIcon ? await findUiImage(inputRoot, uiIcon) : null
  const existing = await findProjectImage(projectRoot, fileName)
  let status = found ? 'found' : 'missing'
  let copiedTo = null

  if (found) {
    const destination = path.join(projectRoot, 'src', 'images', 'trucks', `${fileName}${path.extname(found)}`)
    await fs.copyFile(found, destination)
    status = 'copied'
    copiedTo = path.relative(projectRoot, destination).replaceAll(path.sep, '/')
  } else if (existing) {
    status = 'existing'
    copiedTo = path.relative(projectRoot, existing).replaceAll(path.sep, '/')
  }

  return {
    source,
    file: fileName,
    xml: relative,
    truckImage,
    uiIcon,
    referencedPath: uiIcon ? `ui/textures/${uiIcon}` : null,
    sourceFile: found
      ? path.relative(inputRoot, found).replaceAll(path.sep, '/')
      : existing
        ? 'project-existing'
        : null,
    copiedTo,
    status
  }
}

async function findProjectImage(projectRoot, fileName) {
  const imageRoot = path.join(projectRoot, 'src', 'images', 'trucks')
  for (const extension of ['webp', 'png', 'jpg', 'jpeg']) {
    const candidate = path.join(imageRoot, `${fileName}.${extension}`)
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // Try the next supported extension.
    }
  }
  return null
}

async function findUiImage(root, icon) {
  const target = icon.toLowerCase()
  const files = await findFiles(root, '')
  return files.find(file => {
    const normalized = file.replaceAll(path.sep, '/').toLowerCase()
    const base = path.basename(file, path.extname(file)).toLowerCase()
    return normalized.includes('/ui/textures/') && base === target
  }) ?? null
}

function mergeDefaults(left, right) {
  const result = structuredClone(left)
  for (const [selector, values] of Object.entries(right)) {
    result[selector] = { ...(result[selector] ?? {}), ...values }
  }
  return result
}

async function writeDefaults(root, defaults) {
  const target = path.join(root, 'src', 'modules', 'data', 'defaults', 'generated.ts')
  const content = [
    "import type { IDefaults } from './types'",
    '',
    '/** Generated from the installed SnowRunner XML snapshot. Do not edit manually. */',
    `export default ${JSON.stringify(sortObject(defaults), null, 2)} satisfies IDefaults`,
    ''
  ].join('\n')
  await fs.writeFile(target, content, 'utf8')
}

async function writeJson(target, value) {
  await fs.writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortObject(value[key])]))
}
