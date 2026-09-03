#define MyAppName "SnowRunnerXMLEditor"
#define MyAppDisplayName "SnowRunner XML Editor Next"
#define MyAppVersion "2.0.0-beta.2"
#define MyAppPublisher "zedkam"
#define MyAppURL "https://github.com/zedkam/SnowRunner-XML-Editor-Next"
#define MyAppExeName "SnowRunnerXMLEditor.exe"

[Setup]
AppId={{A9C12A97-351E-453E-B121-A2B1A1D5B56D}
AppName={#MyAppDisplayName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppDisplayName}
OutputDir="..\out"
OutputBaseFilename={#MyAppName}
SetupIconFile="..\out\{#MyAppName}\resources\app\.vite\build\favicon.ico"
AppReadmeFile="..\out\{#MyAppName}\resources\app\.vite\README.md"
LicenseFile="..\out\{#MyAppName}\resources\app\.vite\LICENSE"
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "de"; MessagesFile: "compiler:Languages/German.isl"
Name: "ru"; MessagesFile: "compiler:Languages/Russian.isl"

[Files]
Source: "..\out\{#MyAppName}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autodesktop}\{#MyAppDisplayName}"; Filename: "{app}\{#MyAppExeName}"; AfterInstall: SetElevationBit('{autodesktop}\{#MyAppDisplayName}.lnk')
Name: "{group}\{#MyAppDisplayName}"; Filename: "{app}\{#MyAppExeName}"; AfterInstall: SetElevationBit('{group}\{#MyAppDisplayName}.lnk')
Name: "{group}\Uninstall {#MyAppDisplayName}"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent runascurrentuser

[UninstallDelete]
Name: "{app}\resources"; Type: filesandordirs

[Code]
procedure SetElevationBit(Filename: string);
var
  Buffer: string;
  Stream: TStream;
begin
  Filename := ExpandConstant(Filename);

  Stream := TFileStream.Create(FileName, fmOpenReadWrite);
  try
    Stream.Seek(21, soFromBeginning);
    SetLength(Buffer, 1);
    Stream.ReadBuffer(Buffer, 1);
    Buffer[1] := Chr(Ord(Buffer[1]) or $20);
    Stream.Seek(-1, soFromCurrent);
    Stream.WriteBuffer(Buffer, 1);
  finally
    Stream.Free;
  end;
end;
