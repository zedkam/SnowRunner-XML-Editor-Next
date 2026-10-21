import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { app } from 'electron'
import { load } from 'cheerio'
import { prepareGameContent, rememberEditedBaseline } from './prepare-game-content'
import type { GameSnapshot } from './prepare-game-content'
import Config from '/mods/data/config/main'
import { Dirs } from '/mods/files/main'
import { providePublic, publicMethod } from '/utils/bridge/main'

/** Local-only baseline: never embedded in or uploaded with the application. */
@providePublic()
class GameBaseline {
  private snapshot: GameSnapshot = { version: 1, files: {} }
  private archive?: string
  private target?: string

  async prepare(): Promise<void> {
    if (!Config.initialPath) return
    this.snapshot = { version: 1, files: {} }
    this.archive = undefined
    this.target = undefined
    const key = createHash('sha256').update(resolve(Config.initialPath).toLowerCase()).digest('hex')
    const folder = join(app.getPath('userData'), 'game-baselines')
    const target = join(folder, `${key}.json`)
    this.snapshot = await prepareGameContent(Config.initialPath, Dirs.dlc.path, target)
    this.archive = Config.initialPath
    this.target = target
  }

  async recordEdited(archive: string): Promise<void> {
    if (this.archive === archive && this.target) {
      await rememberEditedBaseline(archive, this.target, this.snapshot)
    }
  }

  @publicMethod()
  async hasFile(name: string): Promise<boolean> {
    return Object.hasOwn(this.snapshot.files, name)
  }

  @publicMethod()
  async getValue(name: string, selector: string, attribute: string): Promise<string | undefined> {
    const xml = this.snapshot.files[name]
    if (!xml) return
    try {
      return load(xml, { xml: true })(selector).first().attr(attribute)
    } catch {
      return undefined
    }
  }
}

export default new GameBaseline()
