# 🚀 Grudge Builder - Quick Start

## 📦 **Installation**

```bash
# From grudge-builder directory
cd grudge-builder
npm install
```

## 🎮 **Development**

```bash
# Start dev server
npm run dev

# Access at http://localhost:5001
```

## 🔗 **Connect to Backend**

1. **Copy environment file:**
```bash
cp .env.example .env
```

2. **Update `.env` with your backend URL:**
```env
VITE_API_URL=http://localhost:5000  # Local backend
# OR
VITE_API_URL=https://your-repl.replit.app  # Deployed backend
```

3. **Make sure main backend is running:**
```bash
# In root directory
npm run dev
```

## 🎨 **Asset Access**

### **Development:**
Assets are loaded from:
1. `/assets` folder (local development assets)
2. Main app `/public/sprites` (shared sprites)
3. CDN fallback (if configured)

### **Production:**
Configure CDN URL in `.env`:
```env
VITE_CDN_URL=https://cdn.puter.com/grudge
```

## 🗄️ **Data Integration**

The game mode automatically integrates with:
- ✅ Character system
- ✅ Inventory system
- ✅ Crafting system
- ✅ Sprite generation
- ✅ User authentication

## 🎯 **Controls**

- **Arrow Keys**: Move player
- **B**: Open build menu
- **I**: Open inventory
- **ESC**: Return to menu

## 📊 **Project Structure**

```
grudge-builder/
├── src/
│   ├── main.ts              # Entry point
│   ├── config/              # Configuration
│   │   ├── game-config.ts   # Game settings
│   │   └── asset-manifest.ts # Asset registry
│   ├── scenes/              # Game scenes
│   │   ├── LoadingScene.ts  # Asset loading
│   │   ├── MenuScene.ts     # Main menu
│   │   └── BuilderScene.ts  # Main gameplay
│   ├── systems/             # Game systems
│   │   └── AssetManager.ts  # Asset loading
│   └── utils/               # Utilities
│       └── api-client.ts    # API integration
├── assets/                  # Local assets
└── public/                  # Static files
```

## 🚀 **Next Steps**

1. **Add placeholder assets** to `/assets` folder
2. **Test API connection** - verify backend is accessible
3. **Implement building system** - add building placement
4. **Add resource gathering** - implement resource nodes
5. **Integrate crafting** - connect to main crafting system

## 🐛 **Troubleshooting**

### **Assets not loading:**
- Check asset paths in `asset-manifest.ts`
- Verify fallback URLs are correct
- Check browser console for errors

### **API connection failed:**
- Verify backend is running
- Check `VITE_API_URL` in `.env`
- Check CORS settings in backend

### **Game not starting:**
- Clear browser cache
- Check browser console for errors
- Verify all dependencies are installed

## 📚 **Documentation**

- [Full Setup Guide](../GRUDGE_BUILDER_SETUP.md)
- [Deployment Guide](../LIVE_DEPLOYMENT_PLAN.md)
- [Main App Docs](../docs/)

## 🎮 **Ready to Build!**

Your game mode is ready for development. Start by:
1. Running `npm run dev`
2. Opening http://localhost:5001
3. Testing the menu and basic movement
4. Adding your first building!

**Happy Building!** 🏗️

