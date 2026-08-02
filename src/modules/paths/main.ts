import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { IPaths } from './types'
import { GITHUB_REPOSITORY } from '/consts'
import { providePublic, publicField } from '/utils/bridge/main'

export type * from './types'

/** Папка, в которой находится текущий исполняемый скрипт. */
const _dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Обработать путь относительно текущей папки.
 * @param paths Пути.
 * @returns Абсолютный путь.
 */
function resolve(...paths: string[]) {
  return join(_dirname, ...paths)
}

/**
 * Получить путь до json файла.
 * @param name Название файла.
 * @returns Путь до json файла.
 */
function json(name: string): string {
  return resolve(`jsons/${name}.json`)
}

/**
 * Получить дату-время для initial.pak.
 * @returns Дата-время.
 */
function getInitialDateTime() {
  const date = new Date()
  const dateString = date.toISOString().split('T')[0]
  const timeString = date.toLocaleTimeString().replaceAll(':', '-')

  return `${dateString}_${timeString}`
}

/**
 * Пути, используемые в программе.  
 * _main process_
 */
@providePublic()
class Paths {
  /** URL API релизов GitHub. */
  private readonly githubReleaseApiURL = `https://api.github.com/repos/${GITHUB_REPOSITORY}/releases`

  /** URL репозитория GitHub. */
  private readonly githubRepositoryURL = `https://github.com/${GITHUB_REPOSITORY}`

  /** Объект путей. */
  @publicField()
  private accessor object: IPaths = {
    releaseApi: this.githubReleaseApiURL,
    downloadPage: `${this.githubRepositoryURL}/releases`,
    update: `${this.githubRepositoryURL}/releases/download`,
    root: resolve('../../'),
    pages: resolve('../renderer/src/renderer/pages'),
    config: json('config'),
    edited: json('edited'),
    favorites: json('favorites'),
    mods: json('mods'),
    sizes: json('sizes'),
    texts: json('game-texts'),
    exported: json('exported'),
    backupFolder: resolve('backups'),
    backupInitial: resolve('backups/initial.pak'),
    get backupInitialWithDate() {
      return resolve(`backups/initial_${getInitialDateTime()}.pak`)
    },
    backupInitialData: resolve('backups/previous_initial'),
    icon: resolve('../favicon.ico'),
    winrar: resolve('winrar'),
    mainTemp: resolve('mainTemp'),
    modsTemp: resolve('modsTemp'),
    updateTemp: resolve('updateTemp'),
    strings: resolve('mainTemp/[strings]'),
    uninstall: resolve('../../../../unins000.exe'),
    classes: resolve('mainTemp/[media]/classes'),
    templates: resolve('mainTemp/[media]/_templates'),
    dlc: resolve('mainTemp/[media]/_dlc')
  }

  /**
   * Инициализация класса.  
   * __НЕ ИСПОЛЬЗОВАТЬ__
   */
  _init() {
    for (const key in this.object) {
      Object.defineProperty(this, key, {
        get: () => (this.object[key]),
        enumerable: true,
        configurable: false
      })
    }

    return this
  }

  /**
   * Получить пути.
   * @returns Пути.
   */
  get() {
    return { ...this.object }
  }
}

/**
 * Пути, используемые в программе.  
 * _main process_
 */
export default new Paths()._init() as Paths & IPaths
