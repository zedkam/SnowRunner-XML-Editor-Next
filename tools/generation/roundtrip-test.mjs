import fs from 'node:fs/promises'
import process from 'node:process'
import * as cheerio from 'cheerio'

const input = process.argv[2]
if (!input) {
  throw new Error('Usage: node roundtrip-test.mjs <xml-file>')
}

const originalText = await fs.readFile(input, 'utf8')
const withoutDeclaration = originalText.replace(/<\?xml\s+[^>]*\?>/gi, '')
const $ = cheerio.load(`<__sxmle_root>${withoutDeclaration}</__sxmle_root>`, {
  xmlMode: true,
  decodeEntities: false
})

const truckData = $('TruckData').first()
const fuelBefore = truckData.attr('FuelCapacity')
if (fuelBefore === undefined) {
  throw new Error('Round-trip fixture does not contain TruckData/FuelCapacity')
}

const fuelAfter = String(Number(fuelBefore) + 1)
truckData.attr('FuelCapacity', fuelAfter)
const serialized = $.xml()
const reloaded = cheerio.load(serialized, { xmlMode: true, decodeEntities: false })

const checks = {
  changedAttribute: reloaded('TruckData').first().attr('FuelCapacity') === fuelAfter,
  templatesPreserved: reloaded('__sxmle_root > _templates').length === 1,
  truckPreserved: reloaded('__sxmle_root > Truck').length === 1,
  truckImagePreserved: Boolean(reloaded('TruckData').first().attr('TruckImage')),
  uiIconPreserved: reloaded('GameData > UiDesc').first().attr('UiIcon328x458') !== undefined
}

const failed = Object.entries(checks).filter(([, passed]) => !passed)
if (failed.length) {
  throw new Error(`Round-trip failed: ${failed.map(([name]) => name).join(', ')}`)
}

console.log(JSON.stringify({ input, fuelBefore, fuelAfter, checks }, null, 2))
