@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0apps\mobile" || goto :error

echo.
echo ==============================================
echo   MotorSync - Expo Go - Android (rede local)
echo ==============================================
echo.
where node >nul 2>&1 || (
  echo [ERRO] Node.js nao encontrado. Instale Node.js 22.13 ou superior.
  goto :error
)
where npm.cmd >nul 2>&1 || (
  echo [ERRO] npm nao encontrado no Windows.
  goto :error
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)" || (
  echo [ERRO] Node.js antigo. Necessario 22.13 ou superior.
  goto :error
)
if not exist ".env" (
  echo [CONFIGURACAO] Falta apps\mobile\.env, necessario para o Supabase real.
  echo Cole o caminho COMPLETO do .env da sua COPIA ANTIGA do MotorSync.
  echo Exemplo: C:\MotorSync-antigo\apps\mobile\.env
  set /p "ENV_SOURCE=Caminho do .env antigo: "
  call :copy_env
  if errorlevel 1 goto :error
)
node scripts\ensure-dependencies.cjs
if errorlevel 1 goto :error
echo.
echo [INICIANDO] Mantenha este terminal aberto durante o teste.
echo Conecte PC e celular a mesma rede Wi-Fi. Abra o Expo Go SDK 57.
echo Escaneie o QR Code que aparecera abaixo.
echo Para encerrar: Ctrl+C.
echo.
call npm.cmd run start:go
if errorlevel 1 goto :error
goto :end

:copy_env
if not defined ENV_SOURCE exit /b 1
set "ENV_SOURCE=%ENV_SOURCE:"=%"
if not exist "%ENV_SOURCE%" (
  echo [ERRO] Arquivo .env nao encontrado no caminho informado.
  exit /b 1
)
copy /y "%ENV_SOURCE%" ".env" >nul || exit /b 1
echo Configuracao local copiada. Nao publique arquivos .env no GitHub.
exit /b 0

:error
echo.
echo O MotorSync nao foi iniciado. Corrija a mensagem acima e tente de novo.
pause
exit /b 1
:end
endlocal
