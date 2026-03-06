# GRUDGE Warlords - Deployment Script for Windows
# This script automates the deployment process

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "local",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "latest",
    
    [Parameter(Mandatory=$false)]
    [string]$DockerUsername = "yourusername"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 GRUDGE Warlords Deployment Script" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Version: $Version" -ForegroundColor Yellow
Write-Host ""

function Test-Prerequisites {
    Write-Host "📋 Checking prerequisites..." -ForegroundColor Cyan
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Host "✅ Docker is installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker is not installed" -ForegroundColor Red
        exit 1
    }
    
    # Check kubectl
    try {
        kubectl version --client --short | Out-Null
        Write-Host "✅ kubectl is installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ kubectl is not installed" -ForegroundColor Red
        exit 1
    }
    
    # Check Git
    try {
        git --version | Out-Null
        Write-Host "✅ Git is installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Git is not installed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

function Build-DockerImage {
    Write-Host "🔨 Building Docker image..." -ForegroundColor Cyan
    
    $imageName = "$DockerUsername/grudge-warlords:$Version"
    
    docker build -t $imageName .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker image built successfully: $imageName" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

function Push-DockerImage {
    Write-Host "📤 Pushing Docker image to registry..." -ForegroundColor Cyan
    
    $imageName = "$DockerUsername/grudge-warlords:$Version"
    
    # Check if logged in
    $loginCheck = docker info 2>&1 | Select-String "Username"
    if (-not $loginCheck) {
        Write-Host "⚠️  Not logged in to Docker Hub. Logging in..." -ForegroundColor Yellow
        docker login
    }
    
    docker push $imageName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker image pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker push failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

function Deploy-Local {
    Write-Host "🐳 Deploying locally with Docker Compose..." -ForegroundColor Cyan
    
    docker-compose down
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Local deployment successful" -ForegroundColor Green
        Write-Host "🌐 Access your app at: http://localhost:5000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "View logs with: docker-compose logs -f app" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Local deployment failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

function Deploy-Kubernetes {
    param([string]$Context)
    
    Write-Host "☸️  Deploying to Kubernetes ($Context)..." -ForegroundColor Cyan
    
    # Switch context
    kubectl config use-context $Context
    
    # Apply configurations
    Write-Host "Applying namespace..." -ForegroundColor Yellow
    kubectl apply -f k8s/namespace.yaml
    
    Write-Host "Applying secrets..." -ForegroundColor Yellow
    kubectl apply -f k8s/secrets.yaml
    
    Write-Host "Applying configmap..." -ForegroundColor Yellow
    kubectl apply -f k8s/configmap.yaml
    
    Write-Host "Deploying PostgreSQL..." -ForegroundColor Yellow
    kubectl apply -f k8s/postgres.yaml
    
    Write-Host "Deploying Redis..." -ForegroundColor Yellow
    kubectl apply -f k8s/redis.yaml
    
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    kubectl wait --for=condition=ready pod -l app=postgres -n grudge-warlords --timeout=120s
    
    Write-Host "Deploying application..." -ForegroundColor Yellow
    kubectl apply -f k8s/deployment.yaml
    
    if (Test-Path "k8s/ingress.yaml") {
        Write-Host "Deploying ingress..." -ForegroundColor Yellow
        kubectl apply -f k8s/ingress.yaml
    }
    
    Write-Host ""
    Write-Host "✅ Kubernetes deployment complete" -ForegroundColor Green
    Write-Host ""
    
    # Show status
    Write-Host "📊 Deployment Status:" -ForegroundColor Cyan
    kubectl get all -n grudge-warlords
    
    Write-Host ""
    Write-Host "View logs with: kubectl logs -f deployment/grudge-backend -n grudge-warlords" -ForegroundColor Yellow
    Write-Host "Port forward with: kubectl port-forward service/grudge-backend-service 5000:80 -n grudge-warlords" -ForegroundColor Yellow
}

function Update-Deployment {
    param([string]$Context)
    
    Write-Host "🔄 Updating Kubernetes deployment..." -ForegroundColor Cyan
    
    kubectl config use-context $Context
    
    $imageName = "$DockerUsername/grudge-warlords:$Version"
    
    kubectl set image deployment/grudge-backend grudge-backend=$imageName -n grudge-warlords
    
    Write-Host "Waiting for rollout to complete..." -ForegroundColor Yellow
    kubectl rollout status deployment/grudge-backend -n grudge-warlords
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment updated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment update failed" -ForegroundColor Red
        Write-Host "Rolling back..." -ForegroundColor Yellow
        kubectl rollout undo deployment/grudge-backend -n grudge-warlords
        exit 1
    }
    
    Write-Host ""
}

# Main execution
Test-Prerequisites

switch ($Environment) {
    "local" {
        Build-DockerImage
        Deploy-Local
    }
    "docker-desktop" {
        Build-DockerImage
        Push-DockerImage
        Deploy-Kubernetes -Context "docker-desktop"
    }
    "production" {
        Build-DockerImage
        Push-DockerImage
        
        Write-Host "⚠️  You are about to deploy to PRODUCTION" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (yes/no)"
        
        if ($confirm -eq "yes") {
            Deploy-Kubernetes -Context "your-production-context"
        } else {
            Write-Host "Deployment cancelled" -ForegroundColor Yellow
        }
    }
    "update" {
        Build-DockerImage
        Push-DockerImage
        Update-Deployment -Context "your-production-context"
    }
    default {
        Write-Host "❌ Invalid environment: $Environment" -ForegroundColor Red
        Write-Host "Valid options: local, docker-desktop, production, update" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green

