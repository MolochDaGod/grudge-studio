# GRUDGE Warlords - Puter Deployment Script for Windows/VSCode
# Run with: .\scripts\deploy-to-puter.ps1

param(
    [string]$Target = "all",
    [switch]$Update = $false
)

Write-Host "=== GRUDGE Warlords Puter Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if puter-cli is installed
Write-Host "Checking Puter CLI installation..." -ForegroundColor Yellow
try {
    $puterVersion = puter --version 2>&1
    Write-Host "✓ Puter CLI installed: $puterVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Puter CLI not found. Installing..." -ForegroundColor Red
    npm install -g puter-cli
    Write-Host "✓ Puter CLI installed" -ForegroundColor Green
}

# Check login status
Write-Host ""
Write-Host "Checking Puter login status..." -ForegroundColor Yellow
$configPath = "$env:USERPROFILE\.config\puter-cli-nodejs\config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    $username = $config.username
    Write-Host "✓ Logged in as: $username" -ForegroundColor Green
} else {
    Write-Host "✗ Not logged in. Please run: puter login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployment Target: $Target" -ForegroundColor Cyan
Write-Host ""

function Deploy-GrudgeAuth {
    Write-Host "--- Deploying GRUDGE Auth ---" -ForegroundColor Magenta
    $authPath = "puter-deploy\grudge-auth"
    
    if ($Update) {
        Write-Host "Updating existing app..." -ForegroundColor Yellow
        puter app:update grudge-auth $authPath
    } else {
        Write-Host "Creating new app..." -ForegroundColor Yellow
        puter app:create grudge-auth $authPath --description="GRUDGE Authentication Portal"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ grudge-auth deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ grudge-auth deployment failed" -ForegroundColor Red
    }
}

function Deploy-GrudgeCloud {
    Write-Host "--- Deploying GRUDGE Cloud ---" -ForegroundColor Magenta
    $cloudPath = "puter-deploy\grudge-cloud"
    
    if ($Update) {
        puter app:update grudge-cloud $cloudPath
    } else {
        puter app:create grudge-cloud $cloudPath --description="GRUDGE Cloud Admin"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ grudge-cloud deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ grudge-cloud deployment failed" -ForegroundColor Red
    }
}

function Deploy-Workers {
    Write-Host "--- Deploying Puter Workers ---" -ForegroundColor Magenta
    Write-Host "Note: Worker deployment requires manual steps via Puter dashboard" -ForegroundColor Yellow
    Write-Host "1. Upload worker files to Puter FS" -ForegroundColor White
    Write-Host "2. Create worker via puter.workers.create()" -ForegroundColor White
    Write-Host ""
    Write-Host "Worker files ready at:" -ForegroundColor Cyan
    Write-Host "  - puter/workers/grudge-api.ts" -ForegroundColor White
    Write-Host "  - puter/workers/sprite-generator.js" -ForegroundColor White
}

# Execute deployment based on target
switch ($Target.ToLower()) {
    "auth" { Deploy-GrudgeAuth }
    "cloud" { Deploy-GrudgeCloud }
    "workers" { Deploy-Workers }
    "all" {
        Deploy-GrudgeAuth
        Write-Host ""
        Deploy-GrudgeCloud
        Write-Host ""
        Deploy-Workers
    }
    default {
        Write-Host "Invalid target. Use: auth, cloud, workers, or all" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify apps at: https://puter.com/app" -ForegroundColor White
Write-Host "2. Test grudge-auth at: https://grudge-auth.puter.site" -ForegroundColor White
Write-Host "3. Deploy workers manually (see docs/puter-worker-deployment.md)" -ForegroundColor White

