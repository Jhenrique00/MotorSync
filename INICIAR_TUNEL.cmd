@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0apps\mobile" || goto :error

echo ==========================================
echo MotorSync - Expo Go - modo tunel (internet)
echo ==========================================
echo.
where node >nul 2>&1 || (echo [ERRO] Instale Node.js 22.13 ou superior. & goto :error)
where npm.cmd >nul 2>&1 || (echo [ERRO] npm nao encontrado. & goto :error)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)" || (echo [ERRO] Node.js antigo. & goto :error)
if not exist ".env" (
  echo [ERRO] Falta apps\mobile\.env. Execute INICIAR_MOTORSYNC.cmd primeiro para configurar.
  goto :error
)
node scripts\ensure-dependencies.cjs
if errorlevel 1 goto :error
echo.
echo Mantenha este terminal aberto. O tunel requer internet.
echo Uma instalacao adicional oficial do Expo pode ser solicitada.
echo Para encerrar: Ctrl+C.
echo.
call npm.cmd run start:tunnel
if errorlevel 1 goto :error
goto :end
:error
echo.
echo O tunel nao foi iniciado. Verifique a mensagem acima.
pause
exit /b 1
:end
endlocal
