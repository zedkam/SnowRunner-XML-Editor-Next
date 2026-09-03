import type MainGameTexts from './main'
import type { IGameTexts, LocalizedGameText } from './types'
import Config, { Lang } from '/mods/data/config/renderer'
import { initMain, mainMethod, mainObjectField } from '/utils/renderer'

export type * from './types'

/**
 * Работа с игровой локализацией.  
 * _renderer process_
 */
@initMain()
class GameTexts implements IGameTexts {
  /** Объект текстов. */
  @mainObjectField()
  private readonly object!: IGameTexts

  /** Тексты из модификаций. */
  get mods() {
    return this.object.mods
  }
  
  /** Тексты из `initial.pak`. */
  get main() {
    return this.object.main
  }

  /** Тексты из `initial.pak` для всех загруженных локалей. */
  get locales() {
    return this.object.locales
  }

  /** Обработать файл с переводом из `initial.pak` (текущий выбранный язык в программе). */
  @mainMethod()
  initFromInitial!: typeof MainGameTexts.initFromInitial

  /** Обработать файл с переводом из `.pak` файлов модов (текущий выбранный язык в программе). */
  @mainMethod()
  initFromMods!: typeof MainGameTexts.initFromMods

  /**
  * Возвращает игровой перевод по ключу.
  * @param key Ключ.
  * @param modID - id модификации.
  * @returns Игровой перевод.
  */
  get(key: string | undefined, modID?: string): string | undefined {
    let value: string | undefined

    if (!key) {
      return
    }

    if (modID && modID in this.mods && key in this.mods[modID]) {
      value = this.mods[modID][key]
    } else if (key in this.main) {
      value = this.main[key]
    }

    return value
  }

  /**
   * Возвращает русский и английский варианты игрового текста по ключу.
   * Для текущего языка сохраняется приоритет текста модификации.
   * @param key Ключ.
   * @param modID - id модификации.
   * @returns Локализованные значения.
   */
  getLocalized(key: string | undefined, modID?: string): LocalizedGameText {
    const result: LocalizedGameText = {}

    if (!key) {
      return result
    }

    for (const locale of [Lang.ru, Lang.en]) {
      let value = this.locales[locale]?.[key]

      if (locale === Config.lang && modID && modID in this.mods) {
        value = this.mods[modID][key] || value
      }

      if (value) {
        result[locale] = value
      }
    }

    return result
  }
}

/**
 * Работа с игровой локализацией.  
 * _renderer process_
 */
export default new GameTexts()
