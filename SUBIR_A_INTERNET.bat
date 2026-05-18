@echo off
chcp 65001 > nul
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║      AlexAI — Subir a Internet (1 sola vez)     ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Este script va a:
echo  1. Conectar tu cuenta de GitHub
echo  2. Crear el repositorio automaticamente
echo  3. Subir el codigo
echo  4. Darte el link para Railway
echo.
pause

set GH=C:\Users\aleja\AppData\Local\Temp\gh_cli\bin\gh.exe
set REPO_NAME=alexai-english-tutor
set PROJECT_DIR=C:\Users\aleja\Downloads\Agente

:: ── Paso 1: Login GitHub ─────────────────────────────────────
echo.
echo  [1/4] Conectando con GitHub...
echo  - Se abrira tu navegador
echo  - Inicia sesion en GitHub (o crea cuenta gratis en github.com)
echo  - Ingresa el codigo que aparece aqui
echo.
%GH% auth login --web --git-protocol https
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ERROR: No se pudo conectar con GitHub.
    echo  Asegurate de tener internet y vuelve a intentarlo.
    pause
    exit /b 1
)

:: ── Paso 2: Crear repositorio ─────────────────────────────────
echo.
echo  [2/4] Creando repositorio en GitHub...
%GH% repo create %REPO_NAME% --public --source="%PROJECT_DIR%" --remote=origin --push
if %ERRORLEVEL% neq 0 (
    echo.
    echo  El repo puede ya existir. Intentando push directo...
    cd /d "%PROJECT_DIR%"
    git remote remove origin 2>nul
    for /f "tokens=*" %%u in ('%GH% api user --jq .login') do set GITHUB_USER=%%u
    git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
    git branch -M main
    git push -u origin main
)

:: ── Paso 3: Obtener URL del repo ──────────────────────────────
echo.
echo  [3/4] Obteniendo URL del repositorio...
for /f "tokens=*" %%u in ('%GH% api user --jq .login') do set GITHUB_USER=%%u
set REPO_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.
echo  ✅ Codigo subido a: %REPO_URL%

:: ── Paso 4: Instrucciones Railway ─────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                  ULTIMO PASO — RAILWAY                      ║
echo  ║                  (2 minutos, gratis)                        ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║                                                              ║
echo  ║  1. Abre: https://railway.app                                ║
echo  ║  2. Clic "Login" → "Login with GitHub"                       ║
echo  ║  3. Clic "New Project" → "Deploy from GitHub repo"          ║
echo  ║  4. Selecciona: %REPO_NAME%
echo  ║  5. Ve a Variables y agrega:                                 ║
echo  ║     GROK_API_KEY = (tu API key de Groq)                      ║
echo  ║  6. Espera 2 min → te da un link como:                       ║
echo  ║     https://alexai-english-tutor.up.railway.app             ║
echo  ║                                                              ║
echo  ║  Ese link se lo mandas a tus hermanos por WhatsApp 🎉        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  Abriendo railway.app en tu navegador...
start "" "https://railway.app/new"
echo.
pause
