import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { decodeBC1Pct } from './pct-bc1'
import { encodePng } from './png'
import { verifiedCards } from './verified-cards'
import { PakReader } from '/mods/archive/main/zip-reader'
import Config from '/mods/data/config/main'
import { providePublic, publicMethod } from '/utils/bridge/main'

@providePublic()
class LocalGameImages {
  private readonly cache = new Map<string, Promise<string | undefined>>()

  @publicMethod()
  async getSrc(name: string, icon: string): Promise<string | undefined> {
    const card = verifiedCards[name]
    if (!card || card.icon !== icon || !Config.initialPath) return
    const key = `${Config.initialPath}:${name}:${icon}`
    if (!this.cache.has(key)) this.cache.set(key, this.readCard(name))
    return this.cache.get(key)
  }

  private async readCard(name: string): Promise<string | undefined> {
    try {
      const card = verifiedCards[name]
      const pak = await PakReader.open(join(dirname(Config.initialPath!), 'gfx.pak'))
      try {
        const entry = pak.find(`[textures]/ui/flash_auto/trucks_img_lib_i${card.page}.pct`)
        if (!entry) return
        const data = await pak.read(entry)
        if (createHash('sha256').update(data).digest('hex') !== card.sha256) return
        const { width, height, bgra } = decodeBC1Pct(data)
        return `data:image/png;base64,${encodePng(width, height, bgra).toString('base64')}`
      } finally {
        await pak.close()
      }
    } catch (error) {
      console.warn('Could not read verified game image:', name, error)
    }
  }
}

export default new LocalGameImages()
