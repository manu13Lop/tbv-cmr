@echo off
echo ========================================
echo   TBV-CMR - Setup de GitHub Secrets
echo ========================================
echo.

REM Verificar gh CLI
where gh >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: GitHub CLI no encontrado.
    echo Descarga desde: https://cli.github.com/
    pause
    exit /b 1
)

REM Verificar autenticacion
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo No autenticado. Abriendo navegador...
    gh auth login -p https -w
)

REM Verificar remote
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo No hay remote configurado.
    set /p REPO="Nombre del repo (ej: usuario/tbv-cmr): "
    git remote add origin https://github.com/%REPO%.git
)

echo Configurando secrets desde .env.local...
echo.

REM Leer .env.local y configurar secrets
for /f "tokens=1,* delims==" %%a in (.env.local) do (
    set "key=%%a"
    set "value=%%b"
    if "!key!"=="NEXT_PUBLIC_SUPABASE_URL" (
        echo %value% | gh secret set NEXT_PUBLIC_SUPABASE_URL
        echo OK: NEXT_PUBLIC_SUPABASE_URL
    )
    if "!key!"=="NEXT_PUBLIC_SUPABASE_ANON_KEY" (
        echo %value% | gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY
        echo OK: NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    if "!key!"=="SUPABASE_SERVICE_ROLE_KEY" (
        echo %value% | gh secret set SUPABASE_SERVICE_ROLE_KEY
        echo OK: SUPABASE_SERVICE_ROLE_KEY
    )
    if "!key!"=="RESEND_API_KEY" (
        echo %value% | gh secret set RESEND_API_KEY
        echo OK: RESEND_API_KEY
    )
)

echo.
echo ========================================
echo   Setup completado!
echo ========================================
pause
