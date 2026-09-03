param(
  [Parameter(Mandatory = $true)]
  [string]$ArchivePath,
  [string]$Source = 'dlc_18_1',
  [string]$TruckFile = 'mercedes_3850.xml'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archive = (Resolve-Path -LiteralPath $ArchivePath).Path
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "snowrunner-xml-roundtrip-$([guid]::NewGuid().ToString('N'))"
$targetPath = Join-Path $tempRoot $TruckFile
$entryPath = "[media]\_dlc\$Source\classes\trucks\$TruckFile"
$zip = [System.IO.Compression.ZipFile]::OpenRead($archive)

try {
  $entry = $zip.Entries | Where-Object FullName -eq $entryPath | Select-Object -First 1
  if ($null -eq $entry) {
    throw "Fixture not found in archive: $entryPath"
  }

  $null = New-Item -ItemType Directory -Force -Path $tempRoot
  [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $targetPath, $true)
} finally {
  $zip.Dispose()
}

try {
  & node (Join-Path $PSScriptRoot 'roundtrip-test.mjs') $targetPath
  if ($LASTEXITCODE -ne 0) {
    throw "Round-trip test failed with exit code $LASTEXITCODE"
  }
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
