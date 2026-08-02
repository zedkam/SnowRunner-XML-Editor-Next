import { app, shell } from 'electron'
import { createHash } from 'node:crypto'
import { open, readFile } from 'node:fs/promises'
import { get } from 'node:https'
import Loading from '/mods/loading/main'
import Config from '/mods/data/config/main'
import { RELEASE_ASSETS, findReleaseAsset, getLatestAvailableRelease } from './github'
import TextsLoader from './texts'
import { Dirs } from '/mods/files/main'
import Helpers from '/mods/helpers/main'
import { providePublic, publicMethod } from '/utils/bridge/main'

const texts = await TextsLoader.loadMain()

/**
 * Работа с обновлениями программы.  
 * _main process_
 */
@providePublic()
class Updates {
  /**
   * Загрузить файл из сети.
   * @param url URL файла.
   * @param path Путь в файловой системе.
   * @param inMemory Сохранять в памяти.
   * @returns Содержимое файла (при `inMemory=true`).
   */
  download(url: string, path?: string, inMemory = false): Promise<string | void> {
    const { promise, resolve, reject } = Promise.withResolvers<string | void>()

    get(url, async response => {
      const status = response.statusCode ?? 0
      const location = response.headers.location

      if (status >= 300 && status < 400 && location) {
        response.resume()
        this.download(new URL(location, url).toString(), path, inMemory).then(resolve, reject)
        return
      }

      if (status < 200 || status >= 300) {
        response.resume()
        reject(new Error(`Download returned HTTP ${status}`))
        return
      }

      if (inMemory) {
        let chunks = ''

        response.on('data', chunk => chunks += chunk)
        response.on('error', reject)
        response.on('end', () => resolve(chunks))
      } else if (path) {
        const file = await open(path, 'w')
        const writeStream = file.createWriteStream()
        const length = Number.parseInt(response.headers['content-length'] || '0', 10)
        let current = 0

        Loading.setStagesCount(100)
        response.on('data', chunk => {
          current += chunk.length
          if (length > 0) {
            Loading.setCompletedCount(Math.floor(100 * (current / length)))
          }
        })
        response.on('error', reject)
        writeStream.on('error', reject)
        writeStream.on('finish', async () => {
          await file.close()
          Loading.completeStage()
          resolve()
        })
        response.pipe(writeStream)
      }
    })
      .on('error', reject)

    return promise
  }

  /** Проверить SHA-256 загруженного файла по SHA256SUMS.txt релиза. */
  private async verifyChecksum(path: string, checksums: string, name: string) {
    const expected = checksums
      .split(/\r?\n/)
      .map(line => line.match(/^([a-f\d]{64})\s+\*?(.+)$/i))
      .find(match => match?.[2] === name)?.[1]

    if (!expected) {
      throw new Error(`Checksum for ${name} was not found`)
    }

    const actual = createHash('sha256').update(await readFile(path)).digest('hex')

    if (actual.toLowerCase() !== expected.toLowerCase()) {
      throw new Error(`Checksum mismatch for ${name}`)
    }
  }

  /** Запустить процесс обновления программы. */
  @publicMethod()
  async updateApp(portable = false) {
    Loading.init(texts.downloading)

    await Helpers.clearTemp()
    await Dirs.updateTemp.make()

    const release = await getLatestAvailableRelease(Config.version)

    if (!release) {
      throw new Error('No newer GitHub release is available')
    }

    const asset = findReleaseAsset(release.release, portable
      ? RELEASE_ASSETS.portable
      : RELEASE_ASSETS.installer)
    const checksumAsset = findReleaseAsset(release.release, [RELEASE_ASSETS.checksums])

    if (!asset || !checksumAsset) {
      throw new Error('GitHub release is missing update assets or checksums')
    }

    const file = Dirs.updateTemp.file(asset.name)
    const checksums = await this.download(checksumAsset.browser_download_url, undefined, true)

    await this.download(asset.browser_download_url, file.path)
    await this.verifyChecksum(file.path, checksums!, asset.name)

    if (portable) {
      shell.showItemInFolder(file.path)
    } else if (await shell.openPath(file.path)) {
      shell.showItemInFolder(file.path)
    }

    app.quit()
  }
}

/**
 * Работа с обновлениями программы.  
 * _main process_
 */
export default new Updates()
