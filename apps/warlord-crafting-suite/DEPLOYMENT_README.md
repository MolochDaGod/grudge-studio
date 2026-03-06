# 🚀 GRUDGE Warlords - Complete Deployment Documentation

Welcome! This guide will help you deploy GRUDGE Warlords using your complete infrastructure setup.

---

## 📚 **Documentation Index**

1. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete step-by-step setup connecting all systems
2. **[KUBERNETES_DOCKER_DEPLOYMENT.md](KUBERNETES_DOCKER_DEPLOYMENT.md)** - Detailed Kubernetes & Docker guide
3. **[SELF_HOSTED_DEPLOYMENT_GUIDE.md](SELF_HOSTED_DEPLOYMENT_GUIDE.md)** - Traditional server deployment
4. **This file** - Quick start and overview

---

## 🎯 **Quick Start**

### **Option 1: Local Development (Fastest)**

```powershell
# Test locally with Docker Compose
docker-compose up -d

# Access at http://localhost:5000
```

### **Option 2: Deploy to Kubernetes (Recommended)**

```powershell
# Using the deployment script
.\scripts\deploy.ps1 -Environment docker-desktop

# Or manually
kubectl apply -f k8s/
```

### **Option 3: Production Deployment**

```powershell
# Build and deploy to production
.\scripts\deploy.ps1 -Environment production -DockerUsername your-username
```

---

## 🏗️ **Your Infrastructure**

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR WINDOWS PC                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Docker     │  │  VirtualBox  │  │   kubectl    │      │
│  │   Desktop    │  │   (Dev VMs)  │  │  (Manager)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Development & Testing Environment                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Deploy via kubectl
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  LINUX SERVER (Production)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Kubernetes Cluster                          │  │
│  │                                                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │  │ Ingress │→ │ Backend │→ │Database │  │  Redis  │ │  │
│  │  │  Nginx  │  │ 3 Pods  │  │Postgres │  │  Cache  │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │  │
│  │                                                        │  │
│  │  ┌─────────┐  ┌─────────┐                            │  │
│  │  │ Workers │  │ Secrets │                            │  │
│  │  │  Jobs   │  │ Config  │                            │  │
│  │  └─────────┘  └─────────┘                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Production Environment with Auto-scaling                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **What You Have**

### **Files Created**

```
Warlord-Crafting-Suite/
├── Dockerfile                          # Container definition
├── .dockerignore                       # Docker build exclusions
├── docker-compose.yml                  # Local multi-container setup
├── k8s/                                # Kubernetes configurations
│   ├── namespace.yaml                  # Isolated environment
│   ├── secrets.yaml                    # Sensitive data (passwords, keys)
│   ├── configmap.yaml                  # Configuration settings
│   ├── postgres.yaml                   # Database deployment
│   ├── redis.yaml                      # Cache deployment
│   ├── deployment.yaml                 # Application deployment
│   └── ingress.yaml                    # External access & SSL
├── scripts/
│   ├── deploy.ps1                      # Windows deployment script
│   └── deploy.sh                       # Linux deployment script
└── Documentation/
    ├── SETUP_GUIDE.md                  # Complete setup guide
    ├── KUBERNETES_DOCKER_DEPLOYMENT.md # K8s & Docker details
    ├── SELF_HOSTED_DEPLOYMENT_GUIDE.md # Traditional deployment
    └── DEPLOYMENT_README.md            # This file
```

---

## 🔧 **Setup Steps**

### **1. Prerequisites**

**On Your PC:**
- ✅ Docker Desktop installed
- ✅ kubectl installed
- ✅ Git installed
- ✅ Access to Linux server

**On Linux Server:**
- ✅ Kubernetes cluster running
- ✅ kubectl configured
- ✅ Docker installed

### **2. Configure Secrets**

**IMPORTANT:** Before deploying, update these files:

```powershell
# Edit k8s/secrets.yaml
# Change ALL passwords and secrets!

# Generate a strong session secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **3. Update Configuration**

```powershell
# Edit k8s/configmap.yaml
# Change BACKEND_URL to your domain

# Edit k8s/ingress.yaml
# Change yourdomain.com to your actual domain

# Edit k8s/deployment.yaml
# Change yourusername to your Docker Hub username
```

---

## 🚀 **Deployment Workflows**

### **Workflow 1: Local Development**

```powershell
# 1. Make code changes
# ... edit files ...

# 2. Test locally
docker-compose up -d

# 3. View logs
docker-compose logs -f app

# 4. Access app
# http://localhost:5000

# 5. Stop when done
docker-compose down
```

### **Workflow 2: Test on Local Kubernetes**

```powershell
# 1. Build image
docker build -t grudge-warlords:latest .

# 2. Deploy to Docker Desktop Kubernetes
kubectl config use-context docker-desktop
kubectl apply -f k8s/

# 3. Port forward to access
kubectl port-forward service/grudge-backend-service 5000:80 -n grudge-warlords

# 4. Access app
# http://localhost:5000
```

### **Workflow 3: Deploy to Production**

```powershell
# 1. Build and tag image
docker build -t yourusername/grudge-warlords:v1.0 .

# 2. Push to Docker Hub
docker login
docker push yourusername/grudge-warlords:v1.0

# 3. Deploy to production server
kubectl config use-context your-production-context
kubectl set image deployment/grudge-backend grudge-backend=yourusername/grudge-warlords:v1.0 -n grudge-warlords

# 4. Watch rollout
kubectl rollout status deployment/grudge-backend -n grudge-warlords
```

### **Workflow 4: Automated Deployment**

```powershell
# Windows
.\scripts\deploy.ps1 -Environment production -Version v1.0 -DockerUsername yourusername

# Linux
./scripts/deploy.sh production v1.0 yourusername
```

---

## 📊 **Monitoring**

### **Check Status**

```powershell
# View all resources
kubectl get all -n grudge-warlords

# View pods
kubectl get pods -n grudge-warlords

# View services
kubectl get services -n grudge-warlords

# View ingress
kubectl get ingress -n grudge-warlords
```

### **View Logs**

```powershell
# Backend logs
kubectl logs -f deployment/grudge-backend -n grudge-warlords

# Database logs
kubectl logs -f statefulset/postgres -n grudge-warlords

# All logs from a specific pod
kubectl logs <pod-name> -n grudge-warlords
```

### **Debug Issues**

```powershell
# Describe a pod
kubectl describe pod <pod-name> -n grudge-warlords

# Execute commands in pod
kubectl exec -it <pod-name> -n grudge-warlords -- /bin/sh

# View events
kubectl get events -n grudge-warlords --sort-by='.lastTimestamp'
```

---

## 🔄 **Update Process**

### **Rolling Update (Zero Downtime)**

```powershell
# 1. Build new version
docker build -t yourusername/grudge-warlords:v1.1 .

# 2. Push to registry
docker push yourusername/grudge-warlords:v1.1

# 3. Update deployment
kubectl set image deployment/grudge-backend grudge-backend=yourusername/grudge-warlords:v1.1 -n grudge-warlords

# 4. Watch rollout
kubectl rollout status deployment/grudge-backend -n grudge-warlords

# 5. Rollback if needed
kubectl rollout undo deployment/grudge-backend -n grudge-warlords
```

---

## 🎯 **Common Commands**

```powershell
# Build Docker image
docker build -t grudge-warlords:latest .

# Run locally with Docker Compose
docker-compose up -d

# Deploy to Kubernetes
kubectl apply -f k8s/

# Update deployment
kubectl set image deployment/grudge-backend grudge-backend=yourusername/grudge-warlords:latest -n grudge-warlords

# View logs
kubectl logs -f deployment/grudge-backend -n grudge-warlords

# Port forward
kubectl port-forward service/grudge-backend-service 5000:80 -n grudge-warlords

# Delete everything
kubectl delete namespace grudge-warlords
```

---

## 🆘 **Troubleshooting**

### **Pods Not Starting**

```powershell
kubectl describe pod <pod-name> -n grudge-warlords
kubectl logs <pod-name> -n grudge-warlords
```

### **Database Connection Issues**

```powershell
# Check if PostgreSQL is running
kubectl get pods -l app=postgres -n grudge-warlords

# Check secrets
kubectl get secret grudge-secrets -n grudge-warlords -o yaml
```

### **Can't Access via Domain**

```powershell
# Check ingress
kubectl get ingress -n grudge-warlords
kubectl describe ingress grudge-ingress -n grudge-warlords

# Check DNS
nslookup yourdomain.com
```

---

## 📚 **Next Steps**

1. ✅ Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete setup
2. ✅ Configure secrets in `k8s/secrets.yaml`
3. ✅ Test locally with Docker Compose
4. ✅ Deploy to Docker Desktop Kubernetes
5. ✅ Deploy to production server
6. ✅ Setup domain and SSL
7. ✅ Configure monitoring
8. ✅ Setup automated backups

---

## 🎉 **You're Ready!**

Your complete deployment infrastructure is set up and ready to use. Choose the workflow that fits your needs and start deploying!

**Need Help?**
- Check the detailed guides in the documentation
- View logs with `kubectl logs`
- Describe resources with `kubectl describe`
- Check events with `kubectl get events`
