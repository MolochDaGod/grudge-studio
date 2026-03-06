# 🚀 GRUDGE Warlords - Official Puter Deployment Guide

Based on official Puter templates:
- React: https://github.com/HeyPuter/react
- Node.js/Express: https://github.com/HeyPuter/node.js-express.js

---

## 📋 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Puter.com)                                    │
│  • React + Vite (built static files)                    │
│  • Deployed to Puter hosting                            │
│  • Uses Puter SDK for auth                              │
└─────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        ↓                                  ↓
┌──────────────────┐            ┌──────────────────┐
│  Express Backend │            │  Puter Worker    │
│  (Replit/Railway)│            │  (Puter.com)     │
├──────────────────┤            ├──────────────────┤
│ • PostgreSQL DB  │            │ • Puter KV       │
│ • Game logic     │            │ • AI features    │
│ • Characters     │            │ • Sessions       │
│ • Inventory      │            │ • Sprite gen     │
└──────────────────┘            └──────────────────┘
```

---

## 🎯 **Step 1: Build React App for Puter**

### **1.1 Update Vite Config**

Your current `vite.config.ts` already builds to `dist/public/` ✅

### **1.2 Build the App**

```bash
npm run build
```

This creates:
```
dist/public/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── ...
```

### **1.3 Add Puter SDK to Built App**

The Puter SDK is already in your `client/index.html`:
```html
<script src="https://js.puter.com/v2/"></script>
```

✅ This will work in the built version!

---

## 🎯 **Step 2: Deploy Frontend to Puter**

### **Option A: Using Puter GUI**

1. Go to https://puter.com
2. Create new app: "grudge-warlords"
3. Upload `dist/public/` contents
4. Set environment variables:
   - `VITE_BACKEND_URL` = `https://grudge-crafting.replit.app`
   - `VITE_PUTER_WORKER_URL` = `https://grudge-server.puter.site`

### **Option B: Using Puter CLI** (Recommended)

```bash
# Install Puter CLI
npm install -g @heyputer/puter-cli

# Login
puter login

# Deploy
cd dist/public
puter deploy grudge-warlords

# Your app is now at: https://grudge-warlords.puter.site
```

---

## 🎯 **Step 3: Deploy Puter Worker (Backend)**

### **3.1 Prepare Worker File**

Your worker is already ready at:
- `puter-deploy/grudge-server/index.js`
- `puter/grudge-server-worker.js`

### **3.2 Deploy Worker**

```bash
# Using Puter CLI
puter worker deploy grudge-server puter-deploy/grudge-server/index.js

# Or upload via Puter GUI
# Go to https://puter.com/workers
# Create new worker: "grudge-server"
# Upload index.js
```

Your worker is now at: `https://grudge-server.puter.site`

---

## 🎯 **Step 4: Configure Express Backend for Puter**

### **4.1 Update CORS**

Add Puter domains to your Express CORS config in `server/index.ts`:

```typescript
app.use(cors({
  origin: [
    /\.puter\.site$/,
    /\.puter\.com$/,
    /\.replit\.app$/,
    /localhost/
  ],
  credentials: true
}));
```

### **4.2 Add Puter Auth Endpoint**

Already exists! ✅ Your `/api/auth/sso` endpoint handles Puter auth.

---

## 🎯 **Step 5: Connect Everything**

### **5.1 Frontend → Express Backend**

Update `client/src/lib/api.ts` (create if doesn't exist):

```typescript
// Detect environment
const isPuter = window.location.hostname.includes('puter');

export const API_CONFIG = {
  // Express backend (PostgreSQL, game data)
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'https://grudge-crafting.replit.app',
  
  // Puter worker (AI features)
  PUTER_WORKER_URL: import.meta.env.VITE_PUTER_WORKER_URL || 'https://grudge-server.puter.site',
};

// API client
export async function apiCall(endpoint: string, options = {}) {
  const url = endpoint.startsWith('/api/ai') || endpoint.startsWith('/api/sprites')
    ? `${API_CONFIG.PUTER_WORKER_URL}${endpoint}`
    : `${API_CONFIG.BACKEND_URL}${endpoint}`;
    
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
```

### **5.2 Frontend → Puter Worker**

AI features automatically route to Puter Worker:
- `/api/ai/chat` → Puter Worker
- `/api/sprites/generate` → Puter Worker
- `/api/npc/chat` → Puter Worker

### **5.3 Puter Auth Integration**

Update `client/src/contexts/AuthContext.tsx`:

```typescript
useEffect(() => {
  // Check if running on Puter
  if (window.puter) {
    puter.auth.getUser().then(async (puterUser) => {
      if (puterUser) {
        // Authenticate with Express backend
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/auth/sso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: puterUser.username,
            role: 'user',
            puterUserId: puterUser.uuid
          })
        });
        
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('authToken', data.token);
          // User is now authenticated!
        }
      }
    });
  }
}, []);
```

---

## 📦 **Complete Deployment Checklist**

### **Frontend (Puter.com)**
- [ ] Build React app: `npm run build`
- [ ] Deploy to Puter: `puter deploy grudge-warlords`
- [ ] Set environment variables in Puter dashboard
- [ ] Test at `https://grudge-warlords.puter.site`

### **Puter Worker (Puter.com)**
- [ ] Deploy worker: `puter worker deploy grudge-server`
- [ ] Test `/api/health` endpoint
- [ ] Verify AI features work

### **Express Backend (Replit/Railway)**
- [ ] Update CORS for `*.puter.site`
- [ ] Verify `/api/auth/sso` endpoint works
- [ ] Test PostgreSQL connection
- [ ] Deploy to Replit/Railway

---

## 🧪 **Testing**

### **1. Test Frontend**
```
Visit: https://grudge-warlords.puter.site
- Should load React app
- Should auto-login with Puter account
```

### **2. Test Puter Worker**
```bash
curl https://grudge-server.puter.site/api/health
# Should return: {"status":"healthy","app":"grudge-server"}
```

### **3. Test Express Backend**
```bash
curl https://grudge-crafting.replit.app/api/health
# Should return: {"status":"healthy","app":"grudge-warlords"}
```

### **4. Test Full Flow**
1. Login on Puter
2. Open GRUDGE Warlords app
3. Create character (uses Express backend)
4. Chat with AI (uses Puter Worker)
5. Craft items (uses Express backend)

---

## 🎮 **User Experience**

1. User visits `https://grudge-warlords.puter.site`
2. Puter SDK auto-authenticates user
3. Frontend sends Puter UUID to Express backend
4. Express creates/links account in PostgreSQL
5. User plays game:
   - Game data → Express backend (PostgreSQL)
   - AI features → Puter Worker (Puter KV + AI)
6. Sessions stored in Puter KV
7. All data synced across devices

---

## 🚀 **Next Steps**

**Ready to deploy?** I can:
1. ✅ Create the API client (`client/src/lib/api.ts`)
2. ✅ Update AuthContext for Puter integration
3. ✅ Update CORS in Express backend
4. ✅ Create deployment scripts
5. ✅ Build and test the app

**Which would you like me to do first?**
