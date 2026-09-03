param(
  [Parameter(Mandatory = $true)]
  [string]$ArchivePath,
  [Parameter(Mandatory = $true)]
  [string]$OutputRoot,
  [string[]]$Sources = @('dlc_15_5', 'dlc_16', 'dlc_16_5', 'dlc_17', 'dlc_17_5', 'dlc_18', 'dlc_18_1')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

if ($Sources.Count -eq 1 -and $Sources[0].Contains(',')) {
  $Sources = @($Sources[0].Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

$archive = (Resolve-Path -LiteralPath $ArchivePath).Path
$output = [System.IO.Path]::GetFullPath($OutputRoot)
$null = New-Item -ItemType Directory -Force -Path $output
$zip = [System.IO.Compression.ZipFile]::OpenRead($archive)

function Write-ZipEntry([System.IO.Compression.ZipArchiveEntry]$Entry, [string]$RelativePath) {
  $relative = $RelativePath -replace '\\', [System.IO.Path]::DirectorySeparatorChar
  $target = [System.IO.Path]::GetFullPath((Join-Path $output $relative))

  if (-not $target.StartsWith($output + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Archive entry escapes output directory: $RelativePath"
  }

  $parent = Split-Path -Parent $target
  $null = New-Item -ItemType Directory -Force -Path $parent
  [System.IO.Compression.ZipFileExtensions]::ExtractToFile($Entry, $target, $true)
}

try {
  $xmlCount = 0
  $imageCount = 0

  foreach ($source in $Sources) {
    $prefix = "[media]\_dlc\$source\classes\"
    foreach ($entry in @($zip.Entries | Where-Object {
      $_.FullName.StartsWith($prefix) -and $_.FullName.EndsWith('.xml')
    })) {
      $relative = $entry.FullName.Substring('[media]\'.Length)
      Write-ZipEntry $entry $relative
      $xmlCount++
    }
  }

  # Vanilla UI icons are often compiled into engine resources rather than
  # stored as a flat PNG. Extract flat UI files when an installation/archive
  # does contain them (the same layout is used by mods).
  foreach ($entry in @($zip.Entries | Where-Object {
    $_.FullName -match '(?i)(^|\\)ui\\textures\\' -and
    $_.FullName -match '(?i)\.(png|webp|jpg|jpeg)$'
  })) {
    $relative = $entry.FullName -replace '^\[media\]\\', ''
    Write-ZipEntry $entry $relative
    $imageCount++
  }

  [pscustomobject]@{
    Archive = $archive
    OutputRoot = $output
    Sources = ($Sources -join ', ')
    XmlFiles = $xmlCount
    FlatUiImages = $imageCount
  } | Format-List
} finally {
  $zip.Dispose()
}
