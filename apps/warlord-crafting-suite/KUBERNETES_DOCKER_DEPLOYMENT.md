# 🐳 GRUDGE Warlords - Kubernetes & Docker Deployment

Complete guide for deploying GRUDGE Warlords using Docker, Kubernetes, and your existing infrastructure.

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR DEVELOPMENT PC                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Docker       │  │ VirtualBox   │  │ Kubernetes   │          │
│  │ Desktop      │  │ (Dev VMs)    │  │ kubectl      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LINUX SERVER (Production)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Kubernetes Cluster                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │   Ingress   │  │   Backend   │  │  PostgreSQL │      │  │
│  │  │   Nginx     │→ │   Pods      │→ │    Pod      │      │  │
│  │  │ (LoadBalancer)│ │ (3 replicas)│  │ (StatefulSet)│    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │   Workers   │  │   Redis     │  │   Secrets   │      │  │
│  │  │   (Jobs)    │  │   Cache     │  │   ConfigMap │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 **Prerequisites**

### **On Your PC**

- [x] Docker Desktop installed
- [x] kubectl installed
- [x] VirtualBox installed
- [x] Git installed

### **On Linux Server**

- [x] Kubernetes cluster running
- [x] kubectl configured
- [x] Docker installed

---

## 🚀 **Part 1: Dockerize the Application**

### **Step 1: Create Dockerfile**

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.cjs"]
```

### **Step 2: Create .dockerignore**

```
node_modules
dist
.git
.env
.env.local
*.log
.vscode
.history
```

### **Step 3: Build Docker Image**

```powershell
# Build the image
docker build -t grudge-warlords:latest .

# Test locally
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e SESSION_SECRET="your_secret" \
  grudge-warlords:latest

# Access at http://localhost:5000
```

### **Step 4: Create Docker Compose (for local testing)**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: grudge_warlords
      POSTGRES_USER: grudge
      POSTGRES_PASSWORD: changeme
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U grudge"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://grudge:changeme@postgres:5432/grudge_warlords
      SESSION_SECRET: dev_secret_change_in_production
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

Test with Docker Compose:

```powershell
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

---

## ☸️ **Part 2: Deploy to Kubernetes**

### **Step 1: Push Image to Registry**

You need a container registry. Options:

- Docker Hub (free)
- GitHub Container Registry (free)
- Your own private registry

```powershell
# Login to Docker Hub
docker login

# Tag image
docker tag grudge-warlords:latest yourusername/grudge-warlords:latest

# Push to registry
docker push yourusername/grudge-warlords:latest
```

### **Step 2: Create Kubernetes Namespace**

Create `k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: grudge-warlords
```

Apply:

```bash
kubectl apply -f k8s/namespace.yaml
```

### **Step 3: Create Secrets**

Create `k8s/secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: grudge-secrets
  namespace: grudge-warlords
type: Opaque
stringData:
  DATABASE_URL: "postgresql://grudge_prod:CHANGE_ME@postgres-service:5432/grudge_warlords_prod"
  SESSION_SECRET: "GENERATE_STRONG_SECRET_HERE"
  REDIS_URL: "redis://redis-service:6379"
```

Apply:

```bash
kubectl apply -f k8s/secrets.yaml
```

### **Step 4: Create ConfigMap**

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grudge-config
  namespace: grudge-warlords
data:
  NODE_ENV: "production"
  PORT: "5000"
  BACKEND_URL: "https://yourdomain.com"
```

Apply:

```bash
kubectl apply -f k8s/configmap.yaml
```

---

## 📦 **Part 3: Deploy Database (PostgreSQL)**

Create `k8s/postgres.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: grudge-warlords
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: grudge-warlords
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: grudge_warlords_prod
        - name: POSTGRES_USER
          value: grudge_prod
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grudge-secrets
              key: POSTGRES_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: grudge-warlords
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
```

Apply:

```bash
kubectl apply -f k8s/postgres.yaml
```

---

## 🚀 **Part 4: Deploy Application**

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grudge-backend
  namespace: grudge-warlords
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grudge-backend
  template:
    metadata:
      labels:
        app: grudge-backend
    spec:
      containers:
      - name: grudge-backend
        image: yourusername/grudge-warlords:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: grudge-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: grudge-config
              key: PORT
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: grudge-secrets
              key: DATABASE_URL
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: grudge-secrets
              key: SESSION_SECRET
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: grudge-secrets
              key: REDIS_URL
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: grudge-backend-service
  namespace: grudge-warlords
spec:
  selector:
    app: grudge-backend
  ports:
  - port: 80
    targetPort: 5000
  type: ClusterIP
```

Apply:

```bash
kubectl apply -f k8s/deployment.yaml
```

---

## 🌐 **Part 5: Setup Ingress (Nginx)**

Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grudge-ingress
  namespace: grudge-warlords
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com
    - www.yourdomain.com
    secretName: grudge-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: grudge-backend-service
            port:
              number: 80
  - host: www.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: grudge-backend-service
            port:
              number: 80
```

Install Nginx Ingress Controller:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

Apply ingress:

```bash
kubectl apply -f k8s/ingress.yaml
```

---

## 🔄 **Part 6: Deploy Workers (Background Jobs)**

Create `k8s/workers.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grudge-workers
  namespace: grudge-warlords
spec:
  replicas: 2
  selector:
    matchLabels:
      app: grudge-workers
  template:
    metadata:
      labels:
        app: grudge-workers
    spec:
      containers:
      - name: worker
        image: yourusername/grudge-warlords:latest
        command: ["node", "dist/worker.cjs"]  # Your worker script
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: grudge-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: grudge-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: grudge-secrets
              key: REDIS_URL
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

Apply:

```bash
kubectl apply -f k8s/workers.yaml
```

---

## 📊 **Part 7: Monitoring & Logging**

### **View Logs**

```bash
# View backend logs
kubectl logs -f deployment/grudge-backend -n grudge-warlords

# View worker logs
kubectl logs -f deployment/grudge-workers -n grudge-warlords

# View all pods
kubectl get pods -n grudge-warlords

# Describe a pod
kubectl describe pod <pod-name> -n grudge-warlords
```

### **Check Status**

```bash
# Check all resources
kubectl get all -n grudge-warlords

# Check deployments
kubectl get deployments -n grudge-warlords

# Check services
kubectl get services -n grudge-warlords

# Check ingress
kubectl get ingress -n grudge-warlords
```

---

## 🔄 **Part 8: CI/CD Pipeline**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        run: |
          docker build -t yourusername/grudge-warlords:${{ github.sha }} .
          docker tag yourusername/grudge-warlords:${{ github.sha }} yourusername/grudge-warlords:latest
          docker push yourusername/grudge-warlords:${{ github.sha }}
          docker push yourusername/grudge-warlords:latest

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/grudge-backend grudge-backend=yourusername/grudge-warlords:${{ github.sha }} -n grudge-warlords
          kubectl rollout status deployment/grudge-backend -n grudge-warlords
```

---

## 🎯 **Part 9: Complete Deployment Commands**

### **Initial Setup**

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets
kubectl apply -f k8s/secrets.yaml

# 3. Create configmap
kubectl apply -f k8s/configmap.yaml

# 4. Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml

# 5. Deploy Redis (optional)
kubectl apply -f k8s/redis.yaml

# 6. Deploy backend
kubectl apply -f k8s/deployment.yaml

# 7. Deploy workers
kubectl apply -f k8s/workers.yaml

# 8. Setup ingress
kubectl apply -f k8s/ingress.yaml

# 9. Verify everything
kubectl get all -n grudge-warlords
```

### **Update Deployment**

```bash
# Build new image
docker build -t yourusername/grudge-warlords:v1.1 .
docker push yourusername/grudge-warlords:v1.1

# Update deployment
kubectl set image deployment/grudge-backend grudge-backend=yourusername/grudge-warlords:v1.1 -n grudge-warlords

# Check rollout status
kubectl rollout status deployment/grudge-backend -n grudge-warlords

# Rollback if needed
kubectl rollout undo deployment/grudge-backend -n grudge-warlords
```

---

## 🔧 **Part 10: Connect Everything Together**

### **Your PC → Linux Server**

```powershell
# Configure kubectl to connect to your server
# Copy kubeconfig from server
scp user@server-ip:~/.kube/config ~/.kube/config

# Test connection
kubectl get nodes

# View cluster info
kubectl cluster-info
```

### **Docker Desktop → Kubernetes**

Docker Desktop has built-in Kubernetes. Enable it:

1. Open Docker Desktop
2. Settings → Kubernetes
3. Enable Kubernetes
4. Apply & Restart

Now you can test locally:

```powershell
kubectl config use-context docker-desktop
kubectl apply -f k8s/
```

### **VirtualBox → Development**

Use VirtualBox for isolated testing:

1. Create Ubuntu VM
2. Install Docker + Kubernetes (minikube)
3. Test deployments before pushing to production

---

## 📝 **Quick Reference**

```bash
# Build & Push
docker build -t yourusername/grudge-warlords:latest .
docker push yourusername/grudge-warlords:latest

# Deploy
kubectl apply -f k8s/

# Update
kubectl set image deployment/grudge-backend grudge-backend=yourusername/grudge-warlords:latest -n grudge-warlords

# Logs
kubectl logs -f deployment/grudge-backend -n grudge-warlords

# Shell into pod
kubectl exec -it <pod-name> -n grudge-warlords -- /bin/sh

# Port forward (for testing)
kubectl port-forward service/grudge-backend-service 5000:80 -n grudge-warlords
```

---

## 🎉 **Next Steps**

1. Create all Kubernetes YAML files in `k8s/` directory
2. Build and push Docker image
3. Apply Kubernetes configurations
4. Setup domain DNS to point to your cluster
5. Configure SSL certificates
6. Setup monitoring (Prometheus + Grafana)
7. Configure autoscaling

**Your app will now:**

- ✅ Run in containers (Docker)
- ✅ Scale automatically (Kubernetes)
- ✅ Self-heal if crashes
- ✅ Load balance across multiple instances
- ✅ Update with zero downtime
- ✅ Run background workers
- ✅ Store data persistently
