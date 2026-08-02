param(
  [Parameter(Mandatory = $true)]
  [string]$ArchivePath,
  [string[]]$Sources = @('dlc_15_5', 'dlc_16', 'dlc_16_5', 'dlc_17', 'dlc_17_5', 'dlc_18')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archive = (Resolve-Path -LiteralPath $ArchivePath).Path
$zip = [System.IO.Compression.ZipFile]::OpenRead($archive)

try {
  $errors = [System.Collections.Generic.List[object]]::new()
  $knownQuirks = [System.Collections.Generic.List[object]]::new()
  $valid = 0

  foreach ($source in $Sources) {
    $prefix = "[media]\_dlc\$source\"
    $files = @($zip.Entries | Where-Object {
      $_.FullName.StartsWith($prefix) -and $_.FullName.EndsWith('.xml')
    })

    foreach ($entry in $files) {
      $stream = $null
      $textReader = $null
      try {
        # SnowRunner stores XML as fragments: a _templates block can be
        # followed by the actual Truck/Trailer node. Validate the complete
        # file by placing its fragments under a synthetic root.
        $stream = $entry.Open()
        $textReader = [System.IO.StreamReader]::new(
          $stream,
          [System.Text.Encoding]::UTF8,
          $true
        )
        $content = $textReader.ReadToEnd()
        $content = [regex]::Replace($content, '<\?xml\s+[^>]*\?>', '')
        $wrapped = "<__sxmle_root>$content</__sxmle_root>"
        $document = [System.Xml.XmlDocument]::new()
        $document.LoadXml($wrapped)
        $valid++
      } catch {
        $item = [pscustomobject]@{SourceId=$source;Path=$entry.FullName;Error=$_.Exception.Message}
        if ($item.Error -match 'duplicate attribute name') {
          # The retail archive contains a small number of duplicate XML
          # attributes. The editor's tolerant parser accepts these files;
          # keep them visible without treating them as broken DLC content.
          $knownQuirks.Add($item)
        } else {
          $errors.Add($item)
        }
      } finally {
        if ($null -ne $textReader) { $textReader.Dispose() }
        elseif ($null -ne $stream) { $stream.Dispose() }
      }
    }
  }

  [pscustomobject]@{
    Archive = $archive
    Sources = ($Sources -join ', ')
    ValidXml = $valid
    StrictInvalidXml = $errors.Count + $knownQuirks.Count
    KnownGameXmlQuirks = $knownQuirks.Count
    UnexpectedInvalidXml = $errors.Count
  } | Format-List

  if ($knownQuirks.Count -gt 0) {
    Write-Output 'Known retail XML quirks:'
    $knownQuirks | ForEach-Object {
      "[$($_.SourceId)] $($_.Path)"
      "  $($_.Error)"
    }
  }

  if ($errors.Count -gt 0) {
    $errors | ForEach-Object {
      "[$($_.SourceId)] $($_.Path)"
      "  $($_.Error)"
    }
    exit 2
  }
} finally {
  $zip.Dispose()
}
