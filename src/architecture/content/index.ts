export * from './types'

/** Нормализует путь архива, не меняя его смысл. */
export function normalizeContentPath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.?\//, '')
}

/** Извлекает source id для DLC из пути, если он присутствует. */
export function getDlcSourceId(path: string): string | undefined {
  const normalized = normalizeContentPath(path)
  const match = normalized.match(/(?:^|\/)\[?media\]?\/_dlc\/([^/]+)/i)

  return match?.[1]
}
