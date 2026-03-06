# 🏗️ Grudge Builder - Base Building Game Mode

## 🎮 **Overview**

Grudge Builder is the first game mode for GRUDGE Warlords, focusing on base building, resource gathering, and crafting.

## 🎯 **Features**

- **Base Building**: Place and upgrade buildings
- **Resource Gathering**: Collect materials from the world
- **Crafting Integration**: Use the main crafting system
- **Character Progression**: Level up and unlock new buildings
- **Multiplayer**: Visit other players' bases (future)

## 🚀 **Getting Started**

### **Development:**

```bash
# Install dependencies (from root)
npm install

# Run development server
npm run dev

# Access at http://localhost:5000/grudge-builder
```

### **Production:**

```bash
# Build
npm run build

# Deploy
npm run deploy
```

## 📁 **Structure**

See `../GRUDGE_BUILDER_SETUP.md` for detailed folder structure and best practices.

## 🔗 **Integration**

This game mode integrates with:
- Main character system
- Inventory system
- Crafting system
- Sprite generation
- AI NPCs

## 📚 **Documentation**

- [Setup Guide](../GRUDGE_BUILDER_SETUP.md)
- [Asset Management](./docs/assets.md)
- [API Integration](./docs/api.md)
- [Game Design](./docs/design.md)

## 🎨 **Assets**

Assets are loaded from:
1. Local `/assets` folder (development)
2. Main app `/public/sprites` (shared)
3. CDN fallback (production)

## 🛠️ **Tech Stack**

- **Engine**: Phaser 3 / PixiJS
- **Language**: TypeScript
- **Build**: Vite
- **State**: Zustand / Redux
- **API**: Shared API client from main app

## 📝 **TODO**

- [ ] Implement basic building placement
- [ ] Add resource gathering mechanics
- [ ] Integrate crafting system
- [ ] Add save/load functionality
- [ ] Implement multiplayer features

## 🤝 **Contributing**

See main project CONTRIBUTING.md

## 📄 **License**

MIT - See main project LICENSE
