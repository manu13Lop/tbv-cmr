# ============================================
# TBV-CMR - Script de Setup para GitHub
# ============================================
# Ejecuta este script después de crear el repositorio en GitHub
# y configurar el remote: git remote add origin https://github.com/USUARIO/tbv-cmr.git

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TBV-CMR - Setup de GitHub & Secrets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar gh CLI
Write-Host "[1/5] Verificando GitHub CLI..." -ForegroundColor Yellow
try {
    $ghVersion = & gh --version 2>&1
    Write-Host "  OK: gh CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: gh CLI no encontrado. Instala desde https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# 2. Verificar autenticación
Write-Host "[2/5] Verificando autenticación..." -ForegroundColor Yellow
try {
    $authStatus = & gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  No autenticado. Ejecutando gh auth login..." -ForegroundColor Yellow
        & gh auth login -p https -w
    }
    Write-Host "  OK: Autenticado en GitHub" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: No se pudo autenticar" -ForegroundColor Red
    exit 1
}

# 3. Verificar remote
Write-Host "[3/5] Verificando remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  No hay remote configurado." -ForegroundColor Yellow
    $repoName = Read-Host "  Nombre del repositorio en GitHub (ej: usuario/tbv-cmr)"
    git remote add origin "https://github.com/$repoName.git"
    Write-Host "  OK: Remote añadido" -ForegroundColor Green
} else {
    Write-Host "  OK: Remote = $remote" -ForegroundColor Green
}

# 4. Obtener nombre del repo
$remoteUrl = git remote get-url origin
$repoName = ($remoteUrl -split "/" | Select-Object -Last 2) -join "/"
Write-Host "  Repositorio: $repoName" -ForegroundColor Cyan

# 5. Configurar secrets
Write-Host "[4/5] Configurando secrets..." -ForegroundColor Yellow

$secrets = @{
    "NEXT_PUBLIC_SUPABASE_URL" = $env:NEXT_PUBLIC_SUPABASE_URL
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
    "SUPABASE_SERVICE_ROLE_KEY" = $env:SUPABASE_SERVICE_ROLE_KEY
    "RESEND_API_KEY" = $env:RESEND_API_KEY
}

foreach ($key in $secrets.Keys) {
    $value = $secrets[$key]
    if ($value) {
        $value | gh secret set $key --repo $repoName
        Write-Host "  OK: $key" -ForegroundColor Green
    } else {
        Write-Host "  SKIP: $key (variable no encontrada en .env.local)" -ForegroundColor Yellow
    }
}

# Secret adicional para staging
Write-Host ""
$stagingUrl = Read-Host "  URL de staging (ej: https://tbv-cmr.vercel.app) [Enter para omitir]"
if ($stagingUrl) {
    $stagingUrl | gh secret set "STAGING_URL" --repo $repoName
    Write-Host "  OK: STAGING_URL" -ForegroundColor Green
}

# 6. Push inicial
Write-Host "[5/5] Preparando push..." -ForegroundColor Yellow
$confirm = Read-Host "  ¿Hacer push de todos los cambios a main? (s/n)"
if ($confirm -eq "s") {
    git add -A
    git commit -m "feat: fase 1 y 2 completadas - mejoras de seguridad, performance, testing y CI/CD"
    git branch -M main
    git push -u origin main
    Write-Host "  OK: Push completado" -ForegroundColor Green
} else {
    Write-Host "  Push omitido. Ejecuta manualmente cuando estés listo." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup completado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Secrets configurados:" -ForegroundColor Cyan
Write-Host "  - NEXT_PUBLIC_SUPABASE_URL"
Write-Host "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
Write-Host "  - SUPABASE_SERVICE_ROLE_KEY"
Write-Host "  - RESEND_API_KEY"
Write-Host "  - STING_URL (si se proporcionó)"
Write-Host ""
Write-Host "El workflow de CI se ejecutará automáticamente en el próximo push." -ForegroundColor Yellow
