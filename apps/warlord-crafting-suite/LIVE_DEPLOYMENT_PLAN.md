# 🚀 GRUDGE Warlords - Live Deployment Plan

## 🎯 **Deployment Strategy**

### **Architecture Overview**
```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (Vercel/Netlify)                                      │
│  ├── React + Vite                                               │
│  ├── Static Assets (sprites, images)                            │
│  └── CDN Distribution                                            │
│                                                                  │
│  Backend (Replit/Railway/Render)                                │
│  ├── Express API Server                                         │
│  ├── PostgreSQL Database (Neon/Supabase)                        │
│  └── WebSocket Server                                            │
│                                                                  │
│  Puter Cloud                                                     │
│  ├── AI Workers (sprite generation, chat)                       │
│  ├── KV Storage (sessions, cache)                               │
│  └── File Storage (user uploads)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 **Step 1: Deploy Backend (Replit - Easiest)**

### **Why Replit?**
- ✅ Already configured (`.replit` file exists)
- ✅ PostgreSQL included
- ✅ Auto-scaling
- ✅ Free tier available
- ✅ One-click deployment

### **Deploy to Replit:**

1. **Push to GitHub** (if not already):
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Import to Replit**:
   - Go to https://replit.com
   - Click "Create Repl" → "Import from GitHub"
   - Select your repository
   - Replit will auto-detect the `.replit` config

3. **Set Environment Variables** in Replit Secrets:
```env
DATABASE_URL=postgresql://...  # Auto-provided by Replit
SESSION_SECRET=your-secret-key-here
ADMIN_PASSWORD=your-admin-password
PUTER_API_KEY=your-puter-api-key
```

4. **Deploy**:
   - Click "Deploy" button in Replit
   - Your backend will be live at: `https://your-repl-name.replit.app`

---

## 🎨 **Step 2: Deploy Frontend (Vercel - Recommended)**

### **Why Vercel?**
- ✅ Best for React/Vite apps
- ✅ Automatic builds from GitHub
- ✅ Global CDN
- ✅ Free tier with custom domains
- ✅ Preview deployments for PRs

### **Deploy to Vercel:**

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Deploy via GitHub** (recommended):
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - **Framework Preset**: Vite
     - **Root Directory**: `./`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist/public`

3. **Set Environment Variables** in Vercel:
```env
VITE_API_URL=https://your-repl-name.replit.app
VITE_PUTER_APP_ID=your-puter-app-id
```

4. **Deploy**:
   - Vercel will auto-deploy on every push to `main`
   - Your frontend will be live at: `https://your-app.vercel.app`

---

## ☁️ **Step 3: Deploy Puter Worker**

### **Deploy AI Worker:**

```bash
# Deploy the main API worker
npm run deploy:worker

# Or manually
npx tsx scripts/deploy-worker.ts grudge-api
```

### **Verify Deployment:**
```bash
# Check Puter status
npm run puter:status

# Test worker endpoint
curl https://puter.com/app/grudge-api/api/health
```

---

## 🔗 **Step 4: Connect Everything**

### **Update Frontend Environment:**

Create `.env.production` in `client/`:
```env
VITE_API_URL=https://your-repl-name.replit.app
VITE_PUTER_WORKER_URL=https://puter.com/app/grudge-api
VITE_PUTER_APP_ID=your-puter-app-id
```

### **Update Backend Environment:**

In Replit Secrets:
```env
FRONTEND_URL=https://your-app.vercel.app
PUTER_WORKER_URL=https://puter.com/app/grudge-api
CORS_ORIGIN=https://your-app.vercel.app
```

### **Update CORS in `server/index.ts`:**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true
}));
```

---

## 🗄️ **Step 5: Database Setup**

### **Option A: Use Replit PostgreSQL** (Easiest)
- Already included with Replit deployment
- Auto-configured `DATABASE_URL`

### **Option B: Use Neon** (Recommended for Production)
1. Go to https://neon.tech
2. Create a new project
3. Copy connection string
4. Update `DATABASE_URL` in Replit Secrets

### **Run Migrations:**
```bash
# In Replit Shell or locally
npm run db:push
```

---

## ✅ **Step 6: Verify Deployment**

### **Health Checks:**

```bash
# Backend health
curl https://your-repl-name.replit.app/api/health

# Frontend
curl https://your-app.vercel.app

# Puter Worker
curl https://puter.com/app/grudge-api/api/health
```

### **Test Full Flow:**
1. Visit `https://your-app.vercel.app`
2. Create an account
3. Create a character
4. Test sprite generation
5. Test crafting system

---

## 🎮 **Next: Create Grudge Builder Game Mode**

See `GRUDGE_BUILDER_SETUP.md` for the new game mode structure.

---

## 🚨 **Troubleshooting**

### **CORS Errors:**
- Verify `FRONTEND_URL` in backend env
- Check CORS configuration in `server/index.ts`

### **Database Connection:**
- Verify `DATABASE_URL` format
- Run `npm run db:push` to sync schema

### **Puter Worker Not Responding:**
- Check worker deployment: `npm run puter:status`
- Verify API key in environment variables

---

## 📊 **Monitoring**

### **Replit:**
- View logs in Replit console
- Monitor resource usage in dashboard

### **Vercel:**
- View deployment logs in Vercel dashboard
- Monitor analytics and performance

### **Puter:**
- Check worker logs in Puter dashboard
- Monitor KV storage usage

---

**Ready to deploy? Start with Step 1!** 🚀
