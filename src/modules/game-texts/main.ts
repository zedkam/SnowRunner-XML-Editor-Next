import type { FSWatcher } from 'node:fs'
import Archive from '/mods/archive/main'
import type { IGameTexts, ITranslation } from './types'
import Config, { Lang } from '/mods/data/config/main'
import { Dirs } from '/mods/files/main'
import { providePublic, publicField, publicMethod } from '/utils/bridge/main'

export type * from './types'

/**
 * Работа с игровой локализацией.  
 * _main process_
 */
@providePublic()
class GameTexts {
  /** Название файлов локализаций игры для каждого языка. */
  private readonly locals: Record<Lang, string> = {
    [Lang.ru]: 'russian',
    [Lang.en]: 'english',
    [Lang.de]: 'german',
    [Lang.ch]: 'chinese_simplified'
  }

  /** Наблюдатель текущего файла локализации. */
  private stringsWatcher?: FSWatcher

  /** Тексты. */
  @publicField()
  private accessor object: IGameTexts = {
    mods: {},
    main: {},
    locales: {}
  }

  /** Обработать файлы локализации из `initial.pak`. */
  @publicMethod()
  async initFromInitial() {
    if (!await Dirs.strings.exists()) {
      return
    }

    const stringsFile = Dirs.strings.file(`strings_${this.locals[Config.lang]}.str`)
    const parse = async () => {
      await Archive.isInitialUnpacking
      await this.loadInitialTranslations()
    }

    const watchAndParse = async () => {
      try {
        await Archive.isInitialUnpacking
        this.stringsWatcher?.close()
        this.stringsWatcher = await stringsFile.exists()
          ? stringsFile.watch(parse).on('error', watchAndParse)
          : undefined
        await parse()
      } catch {}
    }

    await watchAndParse()
  }

  /** Загрузить тексты игры для всех локалей, нужных карточкам техники. */
  private async loadInitialTranslations() {
    const locales: IGameTexts['locales'] = {}

    for (const lang of Object.values(Lang)) {
      const stringsFile = Dirs.strings.file(`strings_${this.locals[lang]}.str`)

      if (await stringsFile.exists()) {
        locales[lang] = this.parseFile(await stringsFile.read('utf16le'))
      }
    }

    this.set({
      main: locales[Config.lang] || {},
      locales
    })
  }

  /** Обработать файл с переводом из `.pak` файлов модов (текущий выбранный язык в программе). */
  @publicMethod()
  async initFromMods() {
    const result: IGameTexts['mods'] = {}
    const Mods = (await import('/mods/data/mods/main')).default

    for (const mod of Mods) {
      if (!await Dirs.modsTemp.dir(mod.name, 'texts').exists()) {
        continue
      }

      const stringsFile = Dirs.modsTemp.file(mod.name, `texts/strings_${this.locals[Config.lang]}.str`)

      if (!await stringsFile.exists()) {
        continue
      }

      result[mod.name] = this.parseFile(await stringsFile.read('utf16le'))
    }

    this.set({ mods: result })
  }

  /**
   * Обработать файл игрового перевода.
   * @param data Содержимое файла.
   * @returns Игровой перевод.
   */
  private parseFile(data: string): ITranslation {
    const strings = {}
    const lines = data.match(/[^\n\r]+/g)

    if (!lines) {
      return strings
    }

    for (const line of lines) {
      const result = line.split('"')

      if (!result || result.length <= 1) {
        continue
      }

      let [key, value] = line.split('"')

      if (!key || !value) {
        continue
      }

      key = key
        .trimEnd()
        .replaceAll('"', '')
        .replaceAll('\'', '')
        .replaceAll('﻿', '')
      value = value
        .replaceAll('\\', '')

      try {
        strings[key] = value
      } catch {}
    }
    
    return strings
  }

  /**
   * Установить объект перевода.
   * @param newObject Новый объект.
   */
  private set(newObject: Partial<IGameTexts>) {
    this.object = {
      ...this.object,
      ...newObject
    }
  }
}

/**
 * Работа с игровой локализацией.  
 * _main process_
 */
export default new GameTexts()
