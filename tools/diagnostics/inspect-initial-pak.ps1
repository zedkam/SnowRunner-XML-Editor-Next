param(
  [Parameter(Mandatory = $true)]
  [string]$ArchivePath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archive = (Resolve-Path -LiteralPath $ArchivePath).Path
$zip = [System.IO.Compression.ZipFile]::OpenRead($archive)

try {
  $entries = @($zip.Entries)
  $names = @($entries | ForEach-Object {
    if ($_.FullName -match '^\[media\]\\_dlc\\([^\\]+)\\') { $Matches[1] }
  } | Sort-Object -Unique)

  [pscustomobject]@{
    Archive = $archive
    Size = (Get-Item -LiteralPath $archive).Length
    Entries = $entries.Count
  } | Format-List

  $rows = @(foreach ($name in $names) {
    $prefix = "[media]\_dlc\$name\"
    $files = @($entries | Where-Object { $_.FullName.StartsWith($prefix) })
    $trucks = @($files | Where-Object { $_.FullName -match '\\classes\\trucks\\[^\\]+\.xml$' }).Count
    $trailers = @($files | Where-Object { $_.FullName -match '\\classes\\trucks\\trailers\\[^\\]+\.xml$' }).Count
    [pscustomobject]@{ SourceId = $name; Entries = $files.Count; Trucks = $trucks; Trailers = $trailers }
  })

  $rows | Format-Table -AutoSize
} finally {
  $zip.Dispose()
}
