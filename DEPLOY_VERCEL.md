# Warlord Crafting Suite - Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

### Assets Status
- ✅ Images organized in `client/public/2dassets/`:
  - `armor/` - Armor sprites and icons
  - `materials/` - Material icons
  - `professions/` - Profession icons
  - `sprites/` - Character sprites
  - `ui/` - UI elements
  - `weapons/` - Weapon sprites
- ✅ Main images in `client/public/`:
  - `login-bg.png` (3.2MB)
  - `bossgrudge.png` (1.7MB)
  - `opengraph.jpg` (163KB)
- ✅ Root public folder (`public/`):
  - `login-bg.png`
  - `login-card-bg.png`
  - `manifest.json`

### Build Configuration
- ✅ `vercel.json` created with proper asset routing
- ✅ Vite configured to output to `dist/public`
- ✅ All workspace packages updated to MySQL
- ✅ Schema consolidation complete

---

## 🚀 Deployment Steps

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Set Environment Variables

Go to your Vercel project settings and add these environment secrets:

```env
# Database (MySQL)
DB_HOST=<your-db-host>
DB_PORT=<your-db-port>
DB_NAME=<your-db-name>
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>

# Server
NODE_ENV=production
SESSION_SECRET=<generate-random-secret>
ADMIN_PASSWORD=<set-admin-password>
BCRYPT_ROUNDS=10

# Optional: Google Sheets
GOOGLE_SHEET_WEAPONS=<your-sheet-id>
GOOGLE_SHEET_ARMOR=<your-sheet-id>
GOOGLE_SHEET_ITEMS=<your-sheet-id>
GOOGLE_SHEET_CRAFTING=<your-sheet-id>
GOOGLE_SERVICE_ACCOUNT_JSON=<your-service-account-json>

# Optional: OpenAI
OPENAI_API_KEY=<your-openai-key>

# Optional: Crossmint
CROSSMINT_API_KEY=<your-crossmint-key>
```

**Generate secrets:**
```bash
# Session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Admin password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Step 4: Build Test (Local)

```bash
cd apps/warlord-crafting-suite
pnpm build
```

**Expected output:**
- `dist/public/` folder created
- `dist/public/index.html` exists
- `dist/public/2dassets/` folder with all images
- `dist/public/assets/` folder with bundled JS/CSS

**Verify assets:**
```bash
ls dist/public
ls dist/public/2dassets
```

### Step 5: Deploy to Vercel

```bash
# From warlord-crafting-suite directory
cd C:\Users\nugye\Documents\1111111\grudge-studio\apps\warlord-crafting-suite

# Deploy
vercel --prod
```

**Follow prompts:**
1. Set up and deploy? **Y**
2. Scope? Select your account
3. Link to existing project? **N** (first time) or **Y** (subsequent)
4. Project name? `grudge-warlord-crafting`
5. Directory? `./` (current directory)
6. Override settings? **Y**
   - Build Command: `pnpm build`
   - Output Directory: `dist/public`
   - Install Command: `cd ../.. && pnpm install --filter warlord-crafting-suite...`

### Step 6: Verify Deployment

1. **Check Homepage**: Visit your Vercel URL
2. **Test Assets**: Open DevTools → Network
   - Verify `/2dassets/sprites/...` loads
   - Verify `/login-bg.png` loads
   - Check for 404s
3. **Test API**: Try login/register
4. **Database**: Verify connection works

---

## 📁 Asset Structure for Vercel

### Source (Development)
```
apps/warlord-crafting-suite/
├── client/
│   └── public/              <- Vite public directory
│       ├── 2dassets/        <- Game assets
│       │   ├── armor/
│       │   ├── materials/
│       │   ├── professions/
│       │   ├── sprites/
│       │   ├── ui/
│       │   └── weapons/
│       ├── login-bg.png
│       ├── bossgrudge.png
│       └── opengraph.jpg
└── public/                  <- Root public (manifest, etc.)
    ├── login-bg.png
    ├── login-card-bg.png
    └── manifest.json
```

### Build Output (Production)
```
dist/
└── public/                  <- Vercel serves from here
    ├── index.html
    ├── assets/              <- Vite bundles (JS/CSS)
    │   ├── index-abc123.js
    │   └── index-def456.css
    ├── 2dassets/            <- Copied from client/public
    │   ├── armor/
    │   ├── materials/
    │   ├── professions/
    │   ├── sprites/
    │   ├── ui/
    │   └── weapons/
    ├── login-bg.png
    ├── bossgrudge.png
    └── opengraph.jpg
```

---

## 🔧 Troubleshooting

### Assets Not Loading (404)

**Check 1: Build output**
```bash
ls dist/public/2dassets
```
If empty, assets weren't copied. Vite should auto-copy from `client/public/`.

**Check 2: Vercel routes**
Ensure `vercel.json` has:
```json
{
  "routes": [
    { "src": "/2dassets/(.*)", "dest": "/2dassets/$1" }
  ]
}
```

**Check 3: Public directory setting**
In Vercel dashboard:
- Settings → General → Root Directory: `apps/warlord-crafting-suite`
- Output Directory: `dist/public`

### Database Connection Fails

**Check:**
1. Environment variables set in Vercel dashboard
2. MySQL server allows connections from Vercel IPs
3. Test connection from local:
   ```bash
   mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p
   ```

### Build Fails on Vercel

**Common issues:**
1. **Workspace packages not found**
   - Solution: Use `installCommand` in vercel.json to install from monorepo root

2. **Node version mismatch**
   - Solution: Set `NODE_VERSION=20` in build env

3. **TypeScript errors**
   - Run locally: `pnpm type-check`
   - Fix errors before deploying

### Large Asset Size Warning

If Vercel complains about file size:
1. **Optimize images**:
   ```bash
   # Install optimization tool
   npm install -g imagemin-cli
   
   # Optimize PNGs
   imagemin client/public/2dassets/**/*.png --out-dir=client/public/2dassets-opt
   ```

2. **Use CDN for large assets**:
   - Upload `bossgrudge.png` (1.7MB) to Cloudinary/ImgIx
   - Update references in code

---

## 🎯 Post-Deployment Tasks

### 1. Set Up Custom Domain
```bash
vercel domains add yourdomain.com
```

### 2. Enable CORS for API
If using separate frontend domain:
```typescript
// server/index.ts
app.use(cors({
  origin: ['https://yourdomain.com', 'https://*.vercel.app'],
  credentials: true
}));
```

### 3. Monitor Performance
- Vercel Analytics: Enable in dashboard
- Check asset load times
- Monitor API response times

### 4. Set Up Continuous Deployment
Connect GitHub repository:
1. Vercel Dashboard → Git → Connect Repository
2. Select branch: `master`
3. Auto-deploy on push

---

## 📊 Asset Optimization Checklist

### Images Already Optimized
- ✅ login-bg.png: 3.2MB (consider optimizing to <1MB)
- ✅ bossgrudge.png: 1.7MB (consider optimizing)
- ✅ 2dassets sprites: Various sizes

### Recommended Optimizations
```bash
# Compress large PNGs (run from warlord-crafting-suite dir)
pnpm add -D imagemin imagemin-pngquant

# Create optimization script
node << 'EOF' > optimize-images.js
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

(async () => {
  await imagemin(['client/public/*.png'], {
    destination: 'client/public-opt',
    plugins: [
      imageminPngquant({
        quality: [0.6, 0.8]
      })
    ]
  });
  console.log('Images optimized!');
})();
EOF

node optimize-images.js
```

---

## 🚨 Known Limitations

### Vercel Constraints
1. **Serverless Functions**: 10s timeout
   - Long crafting jobs may timeout
   - Consider WebSocket alternative or polling

2. **No WebSocket Support**
   - Battle Arena won't work on Vercel
   - Deploy separately to Railway/Render

3. **Cold Starts**
   - First request may be slow (1-2s)
   - Keep-warm with cron job

4. **Database Connection Pooling**
   - Serverless functions don't maintain connections
   - Use connection pooling in code (already implemented)

---

## 📝 Deployment Checklist

Before deploying:
- [ ] Run `pnpm build` successfully
- [ ] Test build locally: `pnpm preview`
- [ ] Environment variables configured in Vercel
- [ ] Assets present in `dist/public/2dassets`
- [ ] Database accessible from external IPs
- [ ] vercel.json routes configured
- [ ] Git committed and pushed

After deploying:
- [ ] Homepage loads correctly
- [ ] Login/Register works
- [ ] Images load without 404s
- [ ] API endpoints respond
- [ ] Database operations work
- [ ] No console errors

---

## 🔗 Useful Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Check deployment logs
vercel logs <deployment-url>

# Remove deployment
vercel remove <deployment-name>

# List deployments
vercel ls

# Pull environment variables
vercel env pull .env.production
```

---

## 🎮 Testing Deployed App

### Manual Tests
1. **Homepage**
   - [ ] Page loads
   - [ ] Background images display
   - [ ] No console errors

2. **Authentication**
   - [ ] Register new account
   - [ ] Login works
   - [ ] Logout works
   - [ ] Guest login works

3. **Character Management**
   - [ ] Create character
   - [ ] View character list
   - [ ] Character sprites load

4. **Crafting System**
   - [ ] View recipes
   - [ ] Start crafting job
   - [ ] Claim completed job

5. **Shop System**
   - [ ] Buy materials
   - [ ] Sell items
   - [ ] Transactions recorded

### Automated Tests
```bash
# Run tests before deploy
pnpm test

# Check TypeScript
pnpm type-check

# Lint code
pnpm lint
```

---

## 📧 Support

If you encounter issues:
1. Check Vercel logs: `vercel logs`
2. Check browser console for errors
3. Verify environment variables
4. Test database connection separately
5. Review build output for missing files

---

**Last Updated**: 2026-01-26
**Version**: 1.0.0
