/** Версия сериализуемого контракта manifest. */
export const CONTENT_MANIFEST_SCHEMA = 1 as const

/** Происхождение файла. Порядок приоритета задаётся SourceResolver. */
export type ContentSourceKind = 'base' | 'dlc' | 'mod' | 'backup'

/** Категория XML-файла, известная редактору. */
export type ContentEntityKind =
  | 'truck'
  | 'trailer'
  | 'addon'
  | 'engine'
  | 'gearbox'
  | 'suspension'
  | 'wheel'
  | 'winch'
  | 'template'
  | 'string'
  | 'unknown'

/** Источник контента в конкретной установке. */
export interface ContentSource {
  kind: ContentSourceKind
  /** `base`, `dlc_17`, имя мода или backup id. */
  id: string
  /** Относительный путь внутри extraction workspace. */
  root: string
  /** Чем выше число, тем раньше источник разрешается. */
  precedence: number
}

/** Стабильная ссылка на сущность. */
export interface ContentEntityRef {
  kind: ContentEntityKind
  /** Имя файла без расширения или другой стабильный game id. */
  id: string
}

/** Запись файла, найденного сканером. */
export interface ContentFile {
  /** Нормализованный `/`-путь внутри архива/workspace. */
  relativePath: string
  source: ContentSource
  entity: ContentEntityRef
  extension: string
  references: string[]
}

/** Диагностика, не препятствующая отображению контента. */
export interface ContentDiagnostic {
  severity: 'info' | 'warning' | 'error'
  code: string
  message: string
  relativePath?: string
  entity?: ContentEntityRef
}

/** Отпечаток исходного игрового архива. */
export interface ContentFingerprint {
  archiveSize: number
  archiveHash?: string
  scannedAt: string
  gameVersion?: string
}

/** Единый read model для списков, редактора и save pipeline. */
export interface ContentManifest {
  schema: typeof CONTENT_MANIFEST_SCHEMA
  fingerprint: ContentFingerprint
  sources: ContentSource[]
  files: ContentFile[]
  diagnostics: ContentDiagnostic[]
}
