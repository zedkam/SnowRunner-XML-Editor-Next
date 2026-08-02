param(
  [Parameter(Mandatory = $true)]
  [string]$GameRoot,
  [string]$ProjectRoot = '',
  [string]$Python = 'python'
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
} else {
  $ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
}

$game = (Resolve-Path -LiteralPath $GameRoot).Path
$pak = Join-Path $game 'preload\paks\client\gfx.pak'
$manifest = Join-Path $ProjectRoot 'docs\architecture\generated-image-links.json'
$script = Join-Path $PSScriptRoot 'extract_game_images.py'

if (-not (Test-Path -LiteralPath $pak)) {
  throw "SnowRunner gfx.pak was not found: $pak"
}
if (-not (Test-Path -LiteralPath $manifest)) {
  throw "Image manifest was not found: $manifest"
}

& $Python $script `
  --pak $pak `
  --links-manifest $manifest `
  --project-root $ProjectRoot

if ($LASTEXITCODE -ne 0) {
  throw "Game image extraction failed with exit code $LASTEXITCODE"
}
