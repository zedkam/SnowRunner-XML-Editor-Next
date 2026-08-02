param(
  [Parameter(Mandatory = $true)]
  [string]$ArchivePath,
  [string]$ProjectRoot = '',
  [string[]]$Sources = @('dlc_15_5', 'dlc_16', 'dlc_16_5', 'dlc_17', 'dlc_17_5', 'dlc_18')
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
} else {
  $ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "snowrunner-xml-generation-$([guid]::NewGuid().ToString('N'))"
$extractScript = Join-Path $PSScriptRoot 'extract-game-content.ps1'
$generator = Join-Path $PSScriptRoot 'generate-content.mjs'
$sourceArg = $Sources -join ','

try {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $extractScript `
    -ArchivePath $ArchivePath -OutputRoot $tempRoot -Sources $sourceArg

  if ($LASTEXITCODE -ne 0) {
    throw "Game content extraction failed with exit code $LASTEXITCODE"
  }

  & node $generator `
    --input-root $tempRoot `
    --project-root $ProjectRoot `
    --archive $ArchivePath `
    --sources $sourceArg

  if ($LASTEXITCODE -ne 0) {
    throw "Content generation failed with exit code $LASTEXITCODE"
  }
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
