import { get } from 'node:https'
import Paths from '/mods/paths/main'

/** Asset релиза GitHub. */
export type GitHubReleaseAsset = {
  name: string
  browser_download_url: string
  size: number
}

/** Релиз GitHub. */
export type GitHubRelease = {
  draft: boolean
  prerelease: boolean
  tag_name: string
  published_at: string | null
  assets: GitHubReleaseAsset[]
}

/** Имена файлов, которые публикуются в релизе. */
export const RELEASE_ASSETS = {
  installer: ['SnowRunnerXMLEditor_update.exe', 'SnowRunnerXMLEditor.exe'],
  portable: ['SnowRunnerXMLEditor_portable.exe', 'SnowRunnerXMLEditor_portable.zip', 'SnowRunnerXMLEditor_portable.rar'],
  checksums: 'SHA256SUMS.txt'
} as const

/** Нормализовать версию из tag_name GitHub. */
export function versionFromTag(tag: string) {
  return tag.replace(/^v/i, '')
}

/** Сравнить две SemVer-подобные версии. */
export function compareVersions(left: string, right: string) {
  const parse = (value: string) => {
    const normalized = versionFromTag(value).split('+')[0]
    const [core, prerelease = ''] = normalized.split('-', 2)
    const numbers = core.split('.').map(part => Number.parseInt(part, 10) || 0)
    const identifiers = prerelease ? prerelease.split('.') : []

    return { numbers, identifiers }
  }

  const leftVersion = parse(left)
  const rightVersion = parse(right)

  for (let index = 0; index < 3; index++) {
    const difference = (leftVersion.numbers[index] ?? 0) - (rightVersion.numbers[index] ?? 0)

    if (difference !== 0) {
      return difference
    }
  }

  if (!leftVersion.identifiers.length && !rightVersion.identifiers.length) {
    return 0
  }

  if (!leftVersion.identifiers.length) {
    return 1
  }

  if (!rightVersion.identifiers.length) {
    return -1
  }

  for (let index = 0; index < Math.max(leftVersion.identifiers.length, rightVersion.identifiers.length); index++) {
    const leftIdentifier = leftVersion.identifiers[index]
    const rightIdentifier = rightVersion.identifiers[index]

    if (leftIdentifier === undefined) {
      return -1
    }

    if (rightIdentifier === undefined) {
      return 1
    }

    const leftNumber = /^\d+$/.test(leftIdentifier)
    const rightNumber = /^\d+$/.test(rightIdentifier)

    if (leftNumber && rightNumber) {
      const difference = Number(leftIdentifier) - Number(rightIdentifier)

      if (difference !== 0) {
        return difference
      }
    } else if (leftNumber !== rightNumber) {
      return leftNumber ? -1 : 1
    } else if (leftIdentifier !== rightIdentifier) {
      return leftIdentifier.localeCompare(rightIdentifier)
    }
  }

  return 0
}

/** Выполнить JSON-запрос к публичному GitHub API. */
async function requestJSON<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = get(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SnowRunner-XML-Editor-Next'
      }
    }, response => {
      const status = response.statusCode ?? 0
      const location = response.headers.location

      if (status >= 300 && status < 400 && location) {
        response.resume()
        void requestJSON<T>(new URL(location, url).toString()).then(resolve, reject)
        return
      }

      if (status < 200 || status >= 300) {
        response.resume()
        reject(new Error(`GitHub API returned HTTP ${status}`))
        return
      }

      let rawData = ''
      response.setEncoding('utf8')
      response.on('data', chunk => rawData += chunk)
      response.on('end', () => {
        try {
          resolve(JSON.parse(rawData) as T)
        } catch (error) {
          reject(error)
        }
      })
    })

    request.on('error', reject)
  })
}

/** Получить релизы нужного канала. Beta-сборки видят prerelease, stable — только latest. */
async function getReleases(currentVersion: string) {
  const includePrerelease = currentVersion.includes('-')
  const url = includePrerelease
    ? `${Paths.releaseApi}?per_page=30`
    : `${Paths.releaseApi}/latest`
  const data = await requestJSON<GitHubRelease | GitHubRelease[]>(url)

  return (Array.isArray(data) ? data : [data])
    .filter(release => !release.draft && release.assets.length > 0)
}

/** Найти самый новый доступный релиз относительно установленной версии. */
export async function getLatestAvailableRelease(currentVersion: string) {
  const releases = await getReleases(currentVersion)
  const includePrerelease = currentVersion.includes('-')
  const sorted = releases
    .filter(release => includePrerelease || !release.prerelease)
    .map(release => ({ release, version: versionFromTag(release.tag_name) }))
    .sort((left, right) => compareVersions(right.version, left.version))

  return sorted.find(item => compareVersions(item.version, currentVersion) > 0)
}

/** Найти asset в релизе по списку допустимых имён. */
export function findReleaseAsset(release: GitHubRelease, names: readonly string[]) {
  return names
    .map(name => release.assets.find(asset => asset.name === name))
    .find(Boolean)
}
