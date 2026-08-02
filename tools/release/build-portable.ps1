param(
  [string]$ProjectRoot = ''
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
} else {
  $ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
}

$out = Join-Path $ProjectRoot 'out'
$package = Get-ChildItem -LiteralPath $out -Directory -Filter 'SnowRunnerXMLEditor-win32-x64' | Select-Object -First 1
if ($null -eq $package) {
  throw 'Portable package directory is missing. Run: npm run package:portable:raw'
}

$rarDir = Join-Path $ProjectRoot 'src\modules\archive\main\archiver\files'
$rarCandidates = @(
  if ($env:ProgramFiles) { Join-Path $env:ProgramFiles 'WinRAR\WinRAR.exe' }
  if (${env:ProgramFiles(x86)}) { Join-Path ${env:ProgramFiles(x86)} 'WinRAR\WinRAR.exe' }
  (Join-Path $rarDir 'Rar.exe')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$rar = $rarCandidates | Select-Object -First 1
if ($null -eq $rar) {
  throw 'WinRAR/RAR executable was not found'
}
$config = Join-Path $PSScriptRoot 'sfx-config.txt'
$target = Join-Path $out 'SnowRunnerXMLEditor_portable.exe'
$buildTarget = Join-Path $out 'SnowRunnerXMLEditor_portable.build.exe'
$source = Join-Path $package.FullName '*'

if (Test-Path -LiteralPath $buildTarget) {
  Remove-Item -LiteralPath $buildTarget -Force
}

# Store the already-built Electron files without recompression. This keeps
# SFX creation reliable with WinRAR and avoids the bundled RAR false-success
# path that can leave a truncated portable executable.
$arguments = @('a', '-inul', '-y', '-ep1', '-m0', '-sfx', "-z$config", $buildTarget, $source)
$process = Start-Process -FilePath $rar -ArgumentList $arguments -WorkingDirectory $ProjectRoot -Wait -PassThru
if ($process.ExitCode -ne 0) {
  throw "WinRAR SFX creation failed with exit code $($process.ExitCode)"
}

if (-not (Test-Path -LiteralPath $buildTarget)) {
  throw "Portable executable was not created: $buildTarget"
}

if (Test-Path -LiteralPath $target) {
  Remove-Item -LiteralPath $target -Force
}
Move-Item -LiteralPath $buildTarget -Destination $target -Force

$file = Get-Item -LiteralPath $target
[pscustomobject]@{
  PortableExecutable = $file.FullName
  Size = $file.Length
  PackageDirectory = $package.FullName
} | Format-List
