param(
  [string]$ProjectRoot = '',
  [string[]]$DlcIds = @('dlc_15_5', 'dlc_16', 'dlc_16_5', 'dlc_17', 'dlc_17_5', 'dlc_18', 'dlc_18_1')
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
} else {
  $ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
}

$optimizedList = Join-Path $ProjectRoot 'src\modules\archive\main\archiver\files\unpack-list-optimized.lst'
$defaults = @(
  (Join-Path $ProjectRoot 'src\modules\data\defaults\renderer.ts'),
  (Join-Path $ProjectRoot 'src\modules\data\defaults\generated.ts')
)
$truckImages = Join-Path $ProjectRoot 'src\images\trucks'
$imageManifest = Join-Path $ProjectRoot 'docs\architecture\generated-image-links.json'
$imageLinks = if (Test-Path -LiteralPath $imageManifest) {
  @(Get-Content -LiteralPath $imageManifest -Raw | ConvertFrom-Json)
} else {
  @()
}

function Test-DlcToken([string]$Token) {
  return (Get-Content -LiteralPath $optimizedList -ErrorAction SilentlyContinue) -match [regex]::Escape($Token)
}

$rows = foreach ($id in $DlcIds) {
  $token = if ($id -match '^dlc_') { $id } else { "dlc_$id" }
  [pscustomobject]@{
    Dlc = $token
    OptimizedExtraction = if (Test-DlcToken $token) { 'present' } else { 'missing' }
    Defaults = if ((Select-String -LiteralPath $defaults -Pattern ([regex]::Escape($token)) -Quiet -ErrorAction SilentlyContinue)) { 'present' } else { 'missing' }
  }
}

$imageNames = @(
  'mercer_6x6r_230', 'hib_billert_m816', 'jangsu_rx600', 'voron_g5352',
  'mercedes_benz_actros_6x6', 'mercedes_benz_zetros_6x6', 'avenhorn_a15', 'padera_std4',
  'mercedes_3850', 'mercedes_mamute_1519'
)
$imageRows = foreach ($name in $imageNames) {
  $link = $imageLinks | Where-Object file -eq $name | Select-Object -First 1
  [pscustomobject]@{
    Asset = $name
    XmlLink = if ($null -ne $link -and $link.uiIcon) { $link.uiIcon } else { 'missing' }
    FlatFile = if (Get-ChildItem -LiteralPath $truckImages -File -ErrorAction SilentlyContinue | Where-Object { $_.BaseName -match [regex]::Escape($name) }) { 'present' } else { 'missing' }
  }
}

Write-Output 'DLC readiness (source snapshot only; no game archive is inspected)'
$rows | Format-Table -AutoSize
Write-Output ''
Write-Output 'Expected truck image assets'
$imageRows | Format-Table -AutoSize
