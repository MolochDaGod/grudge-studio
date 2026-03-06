@echo off
REM Grudge Studio Deployment Setup Script (Windows)
REM This script prepares the monorepo for deployment

setlocal enabledelayedexpansion

cls
echo.
echo 🚀 Grudge Studio Deployment Setup
echo ==================================
echo.

REM Step 1: Check Node and pnpm
echo Step 1: Checking Node.js and pnpm...
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION%
for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
echo ✓ pnpm %PNPM_VERSION%
echo.

REM Step 2: Install dependencies
echo Step 2: Installing dependencies (this may take 5 minutes^)...
call pnpm install --frozen-lockfile
if !errorlevel! neq 0 (
    echo.
    echo ✗ Error: pnpm install failed
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Step 3: Create .env.local
echo Step 3: Setting up environment...
if not exist .env.local (
    copy .env.example .env.local >nul
    echo ✓ Created .env.local from template
    echo.
    echo ⚠️  IMPORTANT: Edit .env.local with your DATABASE_URL
) else (
    echo ✓ .env.local already exists
)
echo.

REM Step 4: Type checking
echo Step 4: Running TypeScript type check...
call pnpm type-check
if !errorlevel! neq 0 (
    echo.
    echo ✗ Error: Type checking failed
    exit /b 1
)
echo ✓ Type checking passed
echo.

REM Step 5: Build
echo Step 5: Building production artifacts...
call pnpm build
if !errorlevel! neq 0 (
    echo.
    echo ✗ Error: Build failed
    exit /b 1
)
echo ✓ Build completed successfully
echo.

REM Step 6: Summary
echo ==================================
echo ✓ Deployment preparation complete!
echo ==================================
echo.
echo Next steps:
echo 1. Edit .env.local with your DATABASE_URL
echo 2. Ensure PostgreSQL is running
echo 3. Run: pnpm db:push (to apply schema^)
echo 4. Choose your deployment platform:
echo    - Vercel:  vercel --prod
echo    - Railway: railway up
echo    - Fly.io:  fly deploy
echo    - Docker:  docker-compose up -d
echo.
pause
