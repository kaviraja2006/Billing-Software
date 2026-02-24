!macro customInstall
  ; This macro allows adding custom files or logic during installation.
  ; By default, electron-builder handles the standard install perfectly.
!macroend

!macro customUninstall
  ; Custom uninstall logic. 
  ; The NSIS installer will show a dialog to remove AppData entirely if 'deleteAppDataOnUninstall' is true, 
  ; or if the user checks the box on the uninstaller (if enabled natively).
!macroend

!macro customInit
  ; Runs before the installer initializes, useful for checking prerequisites
!macroend
