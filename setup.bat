@echo off
REM Quick setup script for Grudge Studio (Windows)

setlocal enabledelayedexpansion

echo.
echo 🚀 Grudge Studio - Quick Setup
echo ========================================

REM Check Node version
echo 📦 Checking Node.js version...
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo    Node version: %NODE_VERSION%

REM Check if pnpm is installed
echo Checking for pnpm...
pnpm -v >nul 2>&1
if errorlevel 1 (
    echo 📥 Installing pnpm...
    call npm install -g pnpm
) else (
    for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
    echo    pnpm version: !PNPM_VERSION!
)

REM Install dependencies
echo.
echo 📚 Installing dependencies (this may take 2-3 minutes^)...
call pnpm install

REM Check if .env.local exists
echo.
if not exist .env.local (
    echo ⚙️  Creating .env.local from template...
    copy .env.example .env.local >nul
    echo    ✅ Created .env.local
    echo.
    echo ⚠️  IMPORTANT: Edit .env.local with your DATABASE_URL before running pnpm db:push
    echo    Example: DATABASE_URL=postgresql://user:password@localhost:5432/grudge_studio
) else (
    echo ✅ .env.local already exists
)

REM Type check
echo.
echo 🔍 Running TypeScript type check...
call pnpm type-check

echo.
echo ✨ Setup complete!
echo.
echo 📖 Next steps:
echo    1. Edit .env.local with your DATABASE_URL
echo    2. Run: pnpm db:push
echo    3. Run: pnpm dev
echo.
echo 🌐 Development server will run on http://localhost:5000
echo.
echo 📚 Documentation:
echo    - Getting started: QUICKSTART.md
echo    - Deployment: docs\DEPLOYMENT.md
echo    - Architecture: docs\ARCHITECTURE.md
echo.
pause
