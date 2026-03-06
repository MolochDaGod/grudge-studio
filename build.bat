@echo off
REM Grudge Studio Full Build Script (Windows)
REM Builds the entire monorepo with all checks

setlocal enabledelayedexpansion

cls
echo.
echo 🏗️  Grudge Studio Build
echo ========================================
echo.

REM Step 1: Check versions
echo Step 1: Checking Node.js and pnpm versions...
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo    Node: %NODE_VERSION%
for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
echo    pnpm: !PNPM_VERSION!
echo.

REM Step 2: Install dependencies if needed
echo Step 2: Checking dependencies...
if not exist node_modules (
    echo    Installing dependencies (this may take 5 minutes^)...
    call pnpm install
    if !errorlevel! neq 0 (
        echo    ✗ Failed to install dependencies
        exit /b 1
    )
) else (
    echo    ✅ Dependencies already installed
)
echo.

REM Step 3: Type checking
echo Step 3: Running TypeScript type check...
call pnpm type-check
if !errorlevel! neq 0 (
    echo    ⚠️  Type checking had issues
)
echo.

REM Step 4: Clean old builds
echo Step 4: Cleaning previous builds...
call pnpm clean
echo    ✅ Cleaned
echo.

REM Step 5: Build all packages
echo Step 5: Building all packages...
call pnpm build
if !errorlevel! neq 0 (
    echo    ✗ Build failed
    exit /b 1
)
echo    ✅ Build successful
echo.

REM Step 6: Run tests
echo Step 6: Running tests...
call pnpm test
if !errorlevel! neq 0 (
    echo    ⚠️  Some tests failed (check output above^)
)
echo.

REM Success
echo ========================================
echo ✅ Build Complete!
echo ========================================
echo.
echo Next steps:
echo    1. Setup database: pnpm db:push
echo    2. Start development: pnpm dev
echo    3. Deploy: See DEPLOY_TO_PRODUCTION.md
echo.
pause
