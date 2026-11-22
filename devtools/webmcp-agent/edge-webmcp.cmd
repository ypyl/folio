@echo off
rem Launch Edge with the WebMCP feature on, so the probe can see Folio's tools.
rem A running Edge ignores the flag, so close it first: this opens a fresh one and
rem the session's tabs come back.
rem
rem Edge lives here on this machine. If it moves, change the path; a Store install
rem is usually under %ProgramFiles(x86)% as well.

set EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
if not exist "%EDGE%" (
  echo Edge was not found at "%EDGE%".
  echo Change EDGE in this file to the path of msedge.exe.
  exit /b 1
)

start "" "%EDGE%" --enable-features=WebMCP %*
