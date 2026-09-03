/** Поддерживаемая локаль игровых текстов. */
export type GameTextLocale = 'RU' | 'EN' | 'DE' | 'CH'

/** Доступные тексты одного ключа на разных языках. */
export type LocalizedGameText = Partial<Record<GameTextLocale, string>>

/** Игровые тексты. */
export interface IGameTexts {
  /** Тексты самой игры. */
  main: ITranslation

  /** Тексты самой игры сразу для всех доступных локалей. */
  locales: Partial<Record<GameTextLocale, ITranslation>>

  /** Тексты модификаций. */
  mods: {
    [modID: string]: ITranslation
  }
}

/** Перевод. */
export interface ITranslation {
  [key: string]: string
}
