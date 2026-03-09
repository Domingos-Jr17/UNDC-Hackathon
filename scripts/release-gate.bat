@echo off
setlocal

powershell -ExecutionPolicy Bypass -File "%~dp0release-gate.ps1"
if errorlevel 1 (
  echo.
  echo Release gate failed.
  exit /b 1
)

echo.
echo Release gate passed.
exit /b 0
