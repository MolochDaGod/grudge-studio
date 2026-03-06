# 🚀 Getting Started with GRUDGE Warlords Deployment

Welcome! This guide will help you get started with deploying GRUDGE Warlords using your complete infrastructure.

---

## 📚 **Documentation Overview**

You now have **complete deployment infrastructure** with multiple guides:

### **1. Quick Start (This File)**
- Fastest way to get running
- Choose your deployment method
- 5-minute setup

### **2. [DEPLOYMENT_README.md](DEPLOYMENT_README.md)**
- Complete overview of all deployment options
- Common commands and workflows
- Troubleshooting guide

### **3. [SETUP_GUIDE.md](SETUP_GUIDE.md)**
- Step-by-step setup for all systems
- Connects PC → VirtualBox → Linux Server → Kubernetes
- Complete infrastructure integration

### **4. [KUBERNETES_DOCKER_DEPLOYMENT.md](KUBERNETES_DOCKER_DEPLOYMENT.md)**
- Detailed Kubernetes & Docker guide
- Production-grade deployment
- Scaling and monitoring

### **5. [SELF_HOSTED_DEPLOYMENT_GUIDE.md](SELF_HOSTED_DEPLOYMENT_GUIDE.md)**
- Traditional server deployment (without Kubernetes)
- PM2 + Nginx setup
- Simpler alternative

---

## ⚡ **Quick Start - Choose Your Path**

### **Path 1: Test Locally (Fastest - 2 minutes)**

```powershell
# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:5000
```

**When to use:** Quick testing, development

---

### **Path 2: Deploy to Docker Desktop Kubernetes (5 minutes)**

```powershell
# 1. Enable Kubernetes in Docker Desktop
# Settings → Kubernetes → Enable Kubernetes

# 2. Update secrets
# Edit k8s/secrets.yaml and change passwords

# 3. Deploy
kubectl apply -f k8s/

# 4. Access
kubectl port-forward service/grudge-backend-service 5000:80 -n grudge-warlords
# Open http://localhost:5000
```

**When to use:** Local Kubernetes testing before production

---

### **Path 3: Deploy to Production Server (15 minutes)**

```powershell
# 1. Build and push Docker image
docker build -t yourusername/grudge-warlords:latest .
docker login
docker push yourusername/grudge-warlords:latest

# 2. SSH to your server
ssh user@your-server-ip

# 3. Clone repository
git clone https://github.com/yourusername/Warlord-Crafting-Suite.git
cd Warlord-Crafting-Suite

# 4. Update configuration
nano k8s/secrets.yaml      # Change passwords
nano k8s/configmap.yaml    # Change domain
nano k8s/deployment.yaml   # Change Docker username

# 5. Deploy
kubectl apply -f k8s/

# 6. Check status
kubectl get all -n grudge-warlords
```

**When to use:** Production deployment

---

### **Path 4: Automated Deployment (1 command)**

```powershell
# Windows
.\scripts\deploy.ps1 -Environment production -DockerUsername yourusername

# Linux
./scripts/deploy.sh production latest yourusername
```

**When to use:** Automated CI/CD workflow

---

## 🎯 **What You Have**

### **Files Created**

```
✅ Dockerfile                    - Container definition
✅ .dockerignore                 - Build exclusions
✅ docker-compose.yml            - Local testing
✅ k8s/                          - Kubernetes configs
   ├── namespace.yaml
   ├── secrets.yaml
   ├── configmap.yaml
   ├── postgres.yaml
   ├── redis.yaml
   ├── deployment.yaml
   └── ingress.yaml
✅ scripts/
   ├── deploy.ps1                - Windows deployment
   └── deploy.sh                 - Linux deployment
✅ Documentation/
   ├── GETTING_STARTED.md        - This file
   ├── DEPLOYMENT_README.md      - Complete overview
   ├── SETUP_GUIDE.md            - Full setup guide
   ├── KUBERNETES_DOCKER_DEPLOYMENT.md
   └── SELF_HOSTED_DEPLOYMENT_GUIDE.md
```

### **Infrastructure Ready**

- ✅ Docker Desktop with Kubernetes
- ✅ VirtualBox for testing
- ✅ Linux Server with Kubernetes cluster
- ✅ kubectl configured
- ✅ All systems connected

---

## 🔧 **Before You Deploy**

### **1. Update Secrets (CRITICAL!)**

Edit `k8s/secrets.yaml`:

```yaml
# Generate strong secrets:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

DATABASE_URL: "postgresql://grudge_prod:CHANGE_PASSWORD@postgres-service:5432/grudge_warlords_prod"
SESSION_SECRET: "GENERATE_NEW_SECRET_HERE"
POSTGRES_PASSWORD: "CHANGE_THIS_PASSWORD"
```

### **2. Update Configuration**

Edit `k8s/configmap.yaml`:
```yaml
BACKEND_URL: "https://yourdomain.com"  # Your actual domain
```

Edit `k8s/deployment.yaml`:
```yaml
image: yourusername/grudge-warlords:latest  # Your Docker Hub username
```

Edit `k8s/ingress.yaml`:
```yaml
- host: yourdomain.com  # Your actual domain
```

---

## 📊 **Check Deployment Status**

```powershell
# View all resources
kubectl get all -n grudge-warlords

# View logs
kubectl logs -f deployment/grudge-backend -n grudge-warlords

# Check pods
kubectl get pods -n grudge-warlords

# Check services
kubectl get services -n grudge-warlords
```

---

## 🆘 **Common Issues**

### **Pods Not Starting**
```powershell
kubectl describe pod <pod-name> -n grudge-warlords
kubectl logs <pod-name> -n grudge-warlords
```

### **Can't Access Application**
```powershell
# Port forward to test
kubectl port-forward service/grudge-backend-service 5000:80 -n grudge-warlords
```

### **Database Connection Failed**
```powershell
# Check if PostgreSQL is running
kubectl get pods -l app=postgres -n grudge-warlords

# Check secrets
kubectl get secret grudge-secrets -n grudge-warlords -o yaml
```

---

## 🎉 **Next Steps**

1. ✅ Choose a deployment path above
2. ✅ Update secrets and configuration
3. ✅ Deploy your application
4. ✅ Test the deployment
5. ✅ Setup domain and SSL (production only)
6. ✅ Configure monitoring
7. ✅ Setup automated backups

---

## 📖 **Learn More**

- **Full Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Kubernetes Details**: [KUBERNETES_DOCKER_DEPLOYMENT.md](KUBERNETES_DOCKER_DEPLOYMENT.md)
- **Traditional Deployment**: [SELF_HOSTED_DEPLOYMENT_GUIDE.md](SELF_HOSTED_DEPLOYMENT_GUIDE.md)
- **Complete Reference**: [DEPLOYMENT_README.md](DEPLOYMENT_README.md)

---

## 💡 **Pro Tips**

1. **Test locally first** with Docker Compose
2. **Test on Docker Desktop Kubernetes** before production
3. **Always update secrets** before deploying
4. **Use version tags** for Docker images (not just `latest`)
5. **Monitor logs** during deployment
6. **Setup backups** immediately after deployment

---

## 🎯 **Your Complete Workflow**

```
1. Develop locally → docker-compose up
2. Test changes → docker build & docker-compose up
3. Test on local K8s → kubectl apply -f k8s/
4. Push to registry → docker push
5. Deploy to production → kubectl set image
6. Monitor → kubectl logs -f
```

---

**Ready to deploy? Pick a path above and get started!** 🚀
