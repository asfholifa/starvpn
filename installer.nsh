!include WinVer.nsh

!macro customHeader
    RequestExecutionLevel admin
!macroend

!macro customInstall
  nsExec::Exec '"$INSTDIR\resources\service\node.exe" "$INSTDIR\resources\service\src\install.js"'
  ${WinVerGetMajor} $R0
  ${IfNot} ${isUpdated}
      ${If} $R0 == 10
        ExecWait '"$INSTDIR\resources\vpn\tap-windows\tap-windows-win10.exe" /sw'
      ${Else}
        ExecWait '"$INSTDIR\resources\vpn\tap-windows\tap-windows-win7.exe" /sw'
      ${EndIf}
  ${EndIf}
!macroend

!macro customUnInit
  nsExec::Exec '"$INSTDIR\resources\service\node.exe" "$INSTDIR\resources\service\src\uninstall.js" "$APPDATA"'
!macroend
