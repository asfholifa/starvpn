Set fso = CreateObject("Scripting.FileSystemObject")
WScript.CreateObject("WScript.Shell").Run fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "..\StarVPN.exe")

