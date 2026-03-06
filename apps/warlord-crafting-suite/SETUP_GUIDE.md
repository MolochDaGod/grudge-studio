# 🎯 Complete Setup Guide - Connecting All Your Systems

This guide will help you connect your PC, VirtualBox, Linux Server, Kubernetes cluster, and Docker Desktop.

---

## 🏗️ **System Architecture**

```
YOUR PC (Windows)
├── Docker Desktop (local testing)
├── VirtualBox (development VMs)
├── kubectl (manages Kubernetes)
└── Git (version control)
        ↓
LINUX SERVER (Production)
├── Kubernetes Cluster
│   ├── Backend Pods (3 replicas)
│   ├── PostgreSQL (StatefulSet)
│   ├── Redis (Cache)
│   └── Workers (Background jobs)
└── Nginx Ingress (Load Balancer)
```

---

## 📋 **Phase 1: Setup Your PC**

### **Step 1: Install Required Tools**

```powershell
# Check if tools are installed
docker --version
kubectl version --client
git --version

# If not installed, download:
# - Docker Desktop: https://www.docker.com/products/docker-desktop
# - kubectl: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
# - Git: https://git-scm.com/download/win
```

### **Step 2: Enable Kubernetes in Docker Desktop**

1. Open Docker Desktop
2. Click Settings (gear icon)
3. Go to **Kubernetes** tab
4. Check **Enable Kubernetes**
5. Click **Apply & Restart**
6. Wait for Kubernetes to start (green indicator)

Verify:
```powershell
kubectl config get-contexts
# Should show "docker-desktop" context
```

### **Step 3: Connect to Your Linux Server**

```powershell
# Test SSH connection
ssh your_username@your_server_ip

# If successful, copy the Kubernetes config
scp your_username@your_server_ip:~/.kube/config ~/.kube/config-server

# Merge configs
$env:KUBECONFIG="$HOME\.kube\config;$HOME\.kube\config-server"
kubectl config get-contexts
```

---

## 🐳 **Phase 2: Test Locally with Docker**

### **Step 1: Build the Docker Image**

```powershell
# Navigate to your project
cd C:\Users\nugye\Documents\1111111\Warlord-Crafting-Suite

# Build the image
docker build -t grudge-warlords:latest .

# Verify image was created
docker images | Select-String grudge-warlords
```

### **Step 2: Test with Docker Compose**

```powershell
# Start all services (PostgreSQL + Redis + App)
docker-compose up -d

# View logs
docker-compose logs -f app

# Check if services are running
docker-compose ps

# Test the app
# Open browser: http://localhost:5000

# Stop services
docker-compose down
```

### **Step 3: Push to Docker Hub**

```powershell
# Login to Docker Hub
docker login
# Enter your username and password

# Tag the image (replace 'yourusername' with your Docker Hub username)
docker tag grudge-warlords:latest yourusername/grudge-warlords:latest

# Push to Docker Hub
docker push yourusername/grudge-warlords:latest
```

---

## ☸️ **Phase 3: Deploy to Kubernetes (Local Testing)**

### **Step 1: Test on Docker Desktop Kubernetes**

```powershell
# Switch to local Kubernetes
kubectl config use-context docker-desktop

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Update secrets (IMPORTANT!)
# Edit k8s/secrets.yaml and change passwords

# Apply configurations
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n grudge-warlords --timeout=120s

# Deploy application
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get all -n grudge-warlords

# View logs
kubectl logs -f deployment/grudge-backend -n grudge-warlords

# Port forward to access locally
kubectl port-forward service/grudge-backend-service 5000:80 -n grudge-warlords
# Access: http://localhost:5000
```

---

## 🖥️ **Phase 4: Deploy to Production (Linux Server)**

### **Step 1: Prepare Your Linux Server**

SSH into your server:
```bash
ssh your_username@your_server_ip
```

Verify Kubernetes is running:
```bash
kubectl get nodes
kubectl cluster-info
```

### **Step 2: Install Nginx Ingress Controller**

```bash
# Install Nginx Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Check ingress controller
kubectl get pods -n ingress-nginx
```

### **Step 3: Install cert-manager (for SSL)**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=120s

# Create Let's Encrypt issuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # Change this!
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### **Step 4: Deploy Your Application**

```bash
# Clone your repository (or upload files)
git clone https://github.com/yourusername/Warlord-Crafting-Suite.git
cd Warlord-Crafting-Suite

# Update secrets with production values
nano k8s/secrets.yaml
# Change all passwords and secrets!

# Update configmap with your domain
nano k8s/configmap.yaml
# Change BACKEND_URL to your domain

# Update ingress with your domain
nano k8s/ingress.yaml
# Change yourdomain.com to your actual domain

# Apply all configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# Wait for database
kubectl wait --for=condition=ready pod -l app=postgres -n grudge-warlords --timeout=300s

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check everything
kubectl get all -n grudge-warlords
kubectl get ingress -n grudge-warlords
```

---

## 🌐 **Phase 5: Configure DNS**

### **Get Your Server's External IP**

```bash
# Get the external IP of your ingress
kubectl get service -n ingress-nginx ingress-nginx-controller

# Look for EXTERNAL-IP column
```

### **Update DNS Records**

In your domain registrar (GoDaddy, Namecheap, etc.):

1. Create **A Record**:
   - Name: `@`
   - Value: `your_server_external_ip`
   - TTL: 300

2. Create **A Record**:
   - Name: `www`
   - Value: `your_server_external_ip`
   - TTL: 300

Wait 5-30 minutes for DNS propagation.

Test:
```powershell
nslookup yourdomain.com
ping yourdomain.com
```

---

## 🔄 **Phase 6: Setup Continuous Deployment**

### **From Your PC**

```powershell
# Make changes to your code
# ... edit files ...

# Build new image
docker build -t yourusername/grudge-warlords:v1.1 .

# Push to Docker Hub
docker push yourusername/grudge-warlords:v1.1

# Update Kubernetes deployment (from your PC!)
kubectl config use-context your-server-context
kubectl set image deployment/grudge-backend grudge-backend=yourusername/grudge-warlords:v1.1 -n grudge-warlords

# Watch the rollout
kubectl rollout status deployment/grudge-backend -n grudge-warlords
```

---

## 🎯 **Phase 7: VirtualBox Development Environment**

### **Create Development VM**

1. Open VirtualBox
2. Create new VM:
   - Name: grudge-dev
   - Type: Linux
   - Version: Ubuntu 22.04
   - RAM: 4GB
   - Disk: 20GB

3. Install Ubuntu

4. Install Docker & Kubernetes:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install minikube (local Kubernetes)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start minikube
minikube start

# Test
kubectl get nodes
```

5. Clone your repo and test deployments before pushing to production

---

## 📊 **Monitoring Your Deployment**

### **From Your PC**

```powershell
# View all resources
kubectl get all -n grudge-warlords

# View logs
kubectl logs -f deployment/grudge-backend -n grudge-warlords

# View pod details
kubectl describe pod <pod-name> -n grudge-warlords

# Execute commands in pod
kubectl exec -it <pod-name> -n grudge-warlords -- /bin/sh

# View events
kubectl get events -n grudge-warlords --sort-by='.lastTimestamp'
```

---

## ✅ **Verification Checklist**

- [ ] Docker Desktop installed and running
- [ ] Kubernetes enabled in Docker Desktop
- [ ] kubectl installed and configured
- [ ] Can connect to Linux server via SSH
- [ ] Docker image builds successfully
- [ ] Docker Compose works locally
- [ ] Image pushed to Docker Hub
- [ ] Kubernetes namespace created
- [ ] Secrets and ConfigMaps applied
- [ ] PostgreSQL running in cluster
- [ ] Backend pods running (3 replicas)
- [ ] Ingress controller installed
- [ ] cert-manager installed
- [ ] DNS pointing to server
- [ ] SSL certificate issued
- [ ] Application accessible via domain
- [ ] Can deploy updates from PC

---

## 🆘 **Troubleshooting**

See `KUBERNETES_DOCKER_DEPLOYMENT.md` for detailed troubleshooting steps.

**Common Issues:**

1. **Pods not starting**: Check logs with `kubectl logs`
2. **Database connection failed**: Verify secrets are correct
3. **Can't access via domain**: Check DNS propagation and ingress
4. **SSL not working**: Check cert-manager logs

---

## 🎉 **You're All Set!**

Your complete infrastructure is now connected:
- ✅ Local development with Docker Compose
- ✅ Testing with Docker Desktop Kubernetes
- ✅ Isolated testing with VirtualBox
- ✅ Production deployment on Linux server
- ✅ Continuous deployment from your PC
- ✅ Auto-scaling and self-healing
- ✅ SSL encryption
- ✅ Load balancing
