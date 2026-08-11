@echo off
setlocal
cd /d "%~dp0"
set PORT=8317
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:%PORT%
  py -m http.server %PORT%
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:%PORT%
  python -m http.server %PORT%
  goto :eof
)
echo Python was not found.
echo You can also open this folder in VS Code and use any static web server extension.
pause
