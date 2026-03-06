#!/bin/bash

# GRUDGE Warlords - Deployment Script for Linux
# This script automates the deployment process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-local}
VERSION=${2:-latest}
DOCKER_USERNAME=${3:-yourusername}

echo -e "${CYAN}🚀 GRUDGE Warlords Deployment Script${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Version: $VERSION${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${CYAN}📋 Checking prerequisites...${NC}"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✅ Docker is installed${NC}"
    else
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    # Check kubectl
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}✅ kubectl is installed${NC}"
    else
        echo -e "${RED}❌ kubectl is not installed${NC}"
        exit 1
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        echo -e "${GREEN}✅ Git is installed${NC}"
    else
        echo -e "${RED}❌ Git is not installed${NC}"
        exit 1
    fi
    
    echo ""
}

# Build Docker image
build_image() {
    echo -e "${CYAN}🔨 Building Docker image...${NC}"
    
    IMAGE_NAME="$DOCKER_USERNAME/grudge-warlords:$VERSION"
    
    docker build -t "$IMAGE_NAME" .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker image built successfully: $IMAGE_NAME${NC}"
    else
        echo -e "${RED}❌ Docker build failed${NC}"
        exit 1
    fi
    
    echo ""
}

# Push Docker image
push_image() {
    echo -e "${CYAN}📤 Pushing Docker image to registry...${NC}"
    
    IMAGE_NAME="$DOCKER_USERNAME/grudge-warlords:$VERSION"
    
    # Check if logged in
    if ! docker info 2>&1 | grep -q "Username"; then
        echo -e "${YELLOW}⚠️  Not logged in to Docker Hub. Logging in...${NC}"
        docker login
    fi
    
    docker push "$IMAGE_NAME"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker image pushed successfully${NC}"
    else
        echo -e "${RED}❌ Docker push failed${NC}"
        exit 1
    fi
    
    echo ""
}

# Deploy locally with Docker Compose
deploy_local() {
    echo -e "${CYAN}🐳 Deploying locally with Docker Compose...${NC}"
    
    docker-compose down
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Local deployment successful${NC}"
        echo -e "${CYAN}🌐 Access your app at: http://localhost:5000${NC}"
        echo ""
        echo -e "${YELLOW}View logs with: docker-compose logs -f app${NC}"
    else
        echo -e "${RED}❌ Local deployment failed${NC}"
        exit 1
    fi
    
    echo ""
}

# Deploy to Kubernetes
deploy_kubernetes() {
    CONTEXT=$1
    
    echo -e "${CYAN}☸️  Deploying to Kubernetes ($CONTEXT)...${NC}"
    
    # Switch context
    kubectl config use-context "$CONTEXT"
    
    # Apply configurations
    echo -e "${YELLOW}Applying namespace...${NC}"
    kubectl apply -f k8s/namespace.yaml
    
    echo -e "${YELLOW}Applying secrets...${NC}"
    kubectl apply -f k8s/secrets.yaml
    
    echo -e "${YELLOW}Applying configmap...${NC}"
    kubectl apply -f k8s/configmap.yaml
    
    echo -e "${YELLOW}Deploying PostgreSQL...${NC}"
    kubectl apply -f k8s/postgres.yaml
    
    echo -e "${YELLOW}Deploying Redis...${NC}"
    kubectl apply -f k8s/redis.yaml
    
    echo -e "${YELLOW}Waiting for database to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgres -n grudge-warlords --timeout=120s
    
    echo -e "${YELLOW}Deploying application...${NC}"
    kubectl apply -f k8s/deployment.yaml
    
    if [ -f "k8s/ingress.yaml" ]; then
        echo -e "${YELLOW}Deploying ingress...${NC}"
        kubectl apply -f k8s/ingress.yaml
    fi
    
    echo ""
    echo -e "${GREEN}✅ Kubernetes deployment complete${NC}"
    echo ""
    
    # Show status
    echo -e "${CYAN}📊 Deployment Status:${NC}"
    kubectl get all -n grudge-warlords
    
    echo ""
    echo -e "${YELLOW}View logs with: kubectl logs -f deployment/grudge-backend -n grudge-warlords${NC}"
    echo -e "${YELLOW}Port forward with: kubectl port-forward service/grudge-backend-service 5000:80 -n grudge-warlords${NC}"
}

# Update existing deployment
update_deployment() {
    CONTEXT=$1
    
    echo -e "${CYAN}🔄 Updating Kubernetes deployment...${NC}"
    
    kubectl config use-context "$CONTEXT"
    
    IMAGE_NAME="$DOCKER_USERNAME/grudge-warlords:$VERSION"
    
    kubectl set image deployment/grudge-backend grudge-backend="$IMAGE_NAME" -n grudge-warlords
    
    echo -e "${YELLOW}Waiting for rollout to complete...${NC}"
    kubectl rollout status deployment/grudge-backend -n grudge-warlords
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment updated successfully${NC}"
    else
        echo -e "${RED}❌ Deployment update failed${NC}"
        echo -e "${YELLOW}Rolling back...${NC}"
        kubectl rollout undo deployment/grudge-backend -n grudge-warlords
        exit 1
    fi
    
    echo ""
}

# Main execution
check_prerequisites

case $ENVIRONMENT in
    local)
        build_image
        deploy_local
        ;;
    docker-desktop)
        build_image
        push_image
        deploy_kubernetes "docker-desktop"
        ;;
    production)
        build_image
        push_image
        
        echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION${NC}"
        read -p "Are you sure? (yes/no): " confirm
        
        if [ "$confirm" = "yes" ]; then
            deploy_kubernetes "your-production-context"
        else
            echo -e "${YELLOW}Deployment cancelled${NC}"
        fi
        ;;
    update)
        build_image
        push_image
        update_deployment "your-production-context"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo -e "${YELLOW}Valid options: local, docker-desktop, production, update${NC}"
        echo ""
        echo "Usage: $0 [environment] [version] [docker-username]"
        echo "Example: $0 production v1.0 myusername"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"

