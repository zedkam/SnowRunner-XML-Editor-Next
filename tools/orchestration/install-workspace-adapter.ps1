[CmdletBinding()]
param(
    [ValidateSet('Install', 'Check')]
    [string]$Mode = 'Install',

    [string]$WorkspaceRoot,

    [switch]$Force
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

function Resolve-SourceRepository {
    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
}

function Find-WorkspaceRoot {
    param([string]$SourceRepository, [string]$RequestedRoot)

    if ($RequestedRoot) {
        return (Resolve-Path -LiteralPath $RequestedRoot).Path
    }

    $cursor = [System.IO.DirectoryInfo]::new($SourceRepository)
    while ($null -ne $cursor) {
        $agents = Join-Path $cursor.FullName 'AGENTS.md'
        $editor = Join-Path $cursor.FullName 'SnowRunner-XML-Editor-Desktop-main'
        $modding = Join-Path $cursor.FullName 'SnowRunner-Modding'
        if ((Test-Path -LiteralPath $agents -PathType Leaf) -and
            (Test-Path -LiteralPath $editor -PathType Container) -and
            (Test-Path -LiteralPath $modding -PathType Container)) {
            return $cursor.FullName
        }
        $cursor = $cursor.Parent
    }

    throw 'Не удалось определить корень SnowrunnerXML. Передайте -WorkspaceRoot.'
}

function Get-FileSha256 {
    param([string]$Path)
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-TreeFingerprint {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        return ''
    }
    $root = (Resolve-Path -LiteralPath $Path).Path.TrimEnd('\')
    $rows = Get-ChildItem -LiteralPath $root -File -Recurse -Force |
        Sort-Object FullName |
        ForEach-Object {
            $relative = $_.FullName.Substring($root.Length).TrimStart('\').Replace('\', '/')
            '{0}:{1}' -f $relative, (Get-FileSha256 -Path $_.FullName)
        }
    return ($rows -join "`n")
}

function Add-DirectoryEntries {
    param(
        [System.Collections.ArrayList]$Entries,
        [string]$SourceRepository,
        [string]$Workspace,
        [string]$RelativeDirectory
    )

    $sourceRoot = (Resolve-Path -LiteralPath (Join-Path $SourceRepository $RelativeDirectory)).Path.TrimEnd('\')
    foreach ($file in Get-ChildItem -LiteralPath $sourceRoot -File -Recurse -Force | Sort-Object FullName) {
        $suffix = $file.FullName.Substring($sourceRoot.Length).TrimStart('\')
        $relative = Join-Path $RelativeDirectory $suffix
        [void]$Entries.Add([pscustomobject]@{
            Relative = $relative.Replace('\', '/')
            Source = $file.FullName
            Destination = Join-Path $Workspace $relative
        })
    }
}

$sourceRepository = Resolve-SourceRepository
$workspace = Find-WorkspaceRoot -SourceRepository $sourceRepository -RequestedRoot $WorkspaceRoot
$workspace = (Resolve-Path -LiteralPath $workspace).Path
$stateRepository = Join-Path $workspace 'SnowRunner-XML-Editor-Desktop-main'
$rootAgents = Join-Path $workspace 'AGENTS.md'
$blenderMcp = Join-Path $workspace '.codex\blender-mcp'

if (-not (Test-Path -LiteralPath $rootAgents -PathType Leaf)) {
    throw "Не найден защищённый корневой AGENTS.md: $rootAgents"
}
if (-not (Test-Path -LiteralPath $stateRepository -PathType Container)) {
    throw "Не найден Git carrier: $stateRepository"
}

$gitRoot = (& git -c "safe.directory=$stateRepository" -C $stateRepository rev-parse --show-toplevel 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or -not $gitRoot) {
    throw "Git carrier не является репозиторием: $stateRepository"
}
$remoteUrl = (& git -c "safe.directory=$stateRepository" -C $stateRepository remote get-url origin 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or -not $remoteUrl) {
    throw 'В Git carrier отсутствует origin.'
}

$agentsHashBefore = Get-FileSha256 -Path $rootAgents
$blenderFingerprintBefore = Get-TreeFingerprint -Path $blenderMcp

$entries = [System.Collections.ArrayList]::new()
foreach ($relative in @(
    '.codex/config.toml',
    '.codex/orchestration/manifest.json',
    '.codex/orchestration/task-state.schema.json',
    '.codex/orchestration/bin/task_state.py',
    '.agents/skills/.snowrunnerxml-managed-skills.json'
)) {
    $source = Join-Path $sourceRepository $relative
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Не найден файл установщика: $source"
    }
    [void]$entries.Add([pscustomobject]@{
        Relative = $relative
        Source = (Resolve-Path -LiteralPath $source).Path
        Destination = Join-Path $workspace $relative
    })
}
Add-DirectoryEntries -Entries $entries -SourceRepository $sourceRepository -Workspace $workspace -RelativeDirectory '.codex/agents'
Add-DirectoryEntries -Entries $entries -SourceRepository $sourceRepository -Workspace $workspace -RelativeDirectory '.agents/skills/orkestr'

$conflicts = @()
$missing = @()
foreach ($entry in $entries) {
    if (-not (Test-Path -LiteralPath $entry.Destination -PathType Leaf)) {
        $missing += $entry.Relative
        continue
    }
    if ((Get-FileSha256 -Path $entry.Source) -ne (Get-FileSha256 -Path $entry.Destination)) {
        $conflicts += $entry.Relative
    }
}

$destinationSkillRoot = Join-Path $workspace '.agents\skills\orkestr'
$expectedSkillFiles = @{}
foreach ($entry in $entries | Where-Object { $_.Relative -like '.agents/skills/orkestr/*' }) {
    $expectedSkillFiles[$entry.Relative.ToLowerInvariant()] = $true
}
$extraSkillFiles = @()
if (Test-Path -LiteralPath $destinationSkillRoot -PathType Container) {
    foreach ($file in Get-ChildItem -LiteralPath $destinationSkillRoot -File -Recurse -Force) {
        $suffix = $file.FullName.Substring($destinationSkillRoot.Length).TrimStart('\').Replace('\', '/')
        $relative = ('.agents/skills/orkestr/' + $suffix).ToLowerInvariant()
        if (-not $expectedSkillFiles.ContainsKey($relative)) {
            $extraSkillFiles += $relative
        }
    }
}

$localConfigPath = Join-Path $workspace '.codex\orchestration\local.json'
if ($Mode -eq 'Check') {
    $errors = @()
    if ($missing.Count -gt 0) {
        $errors += ('missing: ' + ($missing -join ', '))
    }
    if ($conflicts.Count -gt 0) {
        $errors += ('drift: ' + ($conflicts -join ', '))
    }
    if ($extraSkillFiles.Count -gt 0) {
        $errors += ('unexpected managed skill files: ' + ($extraSkillFiles -join ', '))
    }
    if (-not (Test-Path -LiteralPath $localConfigPath -PathType Leaf)) {
        $errors += 'missing: .codex/orchestration/local.json'
    }
    else {
        try {
            $localConfig = Get-Content -LiteralPath $localConfigPath -Raw | ConvertFrom-Json
            if ($localConfig.schema_version -ne 1 -or
                $localConfig.workspace_root -ne $workspace -or
                $localConfig.state_repository -ne $stateRepository -or
                $localConfig.remote -ne 'origin') {
                $errors += 'drift: .codex/orchestration/local.json'
            }
        }
        catch {
            $errors += 'invalid JSON: .codex/orchestration/local.json'
        }
    }
    if ((Get-FileSha256 -Path $rootAgents) -ne $agentsHashBefore) {
        $errors += 'protected file changed during check: AGENTS.md'
    }
    if ((Get-TreeFingerprint -Path $blenderMcp) -ne $blenderFingerprintBefore) {
        $errors += 'protected unmanaged tree changed during check: .codex/blender-mcp'
    }
    if ($errors.Count -gt 0) {
        $errors | ForEach-Object { Write-Error $_ }
        exit 1
    }
    Write-Output "OK: workspace adapter matches $sourceRepository"
    exit 0
}

if ($extraSkillFiles.Count -gt 0) {
    throw ('В managed skill найдены лишние файлы; удаление не выполняется автоматически: ' + ($extraSkillFiles -join ', '))
}
if ($conflicts.Count -gt 0 -and -not $Force) {
    throw ('Целевые managed-файлы отличаются. Повторите с -Force после проверки: ' + ($conflicts -join ', '))
}

$backupRoot = $null
if ($conflicts.Count -gt 0) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupRoot = Join-Path $workspace ".codex\orchestration\backups\$timestamp"
    foreach ($relative in $conflicts) {
        $sourceConflict = Join-Path $workspace $relative
        $backupPath = Join-Path $backupRoot $relative
        $backupParent = Split-Path -Parent $backupPath
        New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
        Copy-Item -LiteralPath $sourceConflict -Destination $backupPath -Force
    }
}

foreach ($entry in $entries) {
    $destinationParent = Split-Path -Parent $entry.Destination
    New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
    Copy-Item -LiteralPath $entry.Source -Destination $entry.Destination -Force
}

$branch = (& git -c "safe.directory=$sourceRepository" -C $sourceRepository branch --show-current).Trim()
$commit = (& git -c "safe.directory=$sourceRepository" -C $sourceRepository rev-parse HEAD).Trim()
$localConfig = [ordered]@{
    schema_version = 1
    workspace_root = $workspace
    state_repository = $stateRepository
    remote = 'origin'
    installed_from_branch = $branch
    installed_from_commit = $commit
    installed_at = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
}
$localConfigJson = $localConfig | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($localConfigPath, $localConfigJson + "`n", [System.Text.UTF8Encoding]::new($false))

if ((Get-FileSha256 -Path $rootAgents) -ne $agentsHashBefore) {
    throw 'Защищённый корневой AGENTS.md изменился во время установки.'
}
if ((Get-TreeFingerprint -Path $blenderMcp) -ne $blenderFingerprintBefore) {
    throw 'Существующий .codex/blender-mcp изменился во время установки.'
}

Write-Output "OK: workspace adapter installed in $workspace"
if ($null -ne $backupRoot) {
    Write-Output "Backup of replaced managed files: $backupRoot"
}
