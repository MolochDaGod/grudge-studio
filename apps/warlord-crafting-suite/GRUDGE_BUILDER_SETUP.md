# 🎮 Grudge Builder - Game Mode Setup

## 📁 **Folder Structure**

```
grudge-builder/
├── README.md                      # Game mode documentation
├── index.html                     # Entry point
├── src/
│   ├── main.ts                    # Game initialization
│   ├── config/
│   │   ├── game-config.ts         # Game settings
│   │   ├── asset-manifest.ts      # Asset registry
│   │   └── api-config.ts          # API endpoints
│   ├── scenes/
│   │   ├── LoadingScene.ts        # Asset loading
│   │   ├── MenuScene.ts           # Main menu
│   │   ├── BuilderScene.ts        # Main builder gameplay
│   │   └── InventoryScene.ts      # Inventory management
│   ├── entities/
│   │   ├── Player.ts              # Player character
│   │   ├── Building.ts            # Placeable buildings
│   │   ├── Resource.ts            # Collectible resources
│   │   └── NPC.ts                 # NPCs and enemies
│   ├── systems/
│   │   ├── AssetManager.ts        # Asset loading & caching
│   │   ├── BuildingSystem.ts      # Building placement
│   │   ├── CraftingSystem.ts      # Crafting integration
│   │   ├── InventorySystem.ts     # Inventory management
│   │   └── SaveSystem.ts          # Save/load game state
│   ├── ui/
│   │   ├── HUD.ts                 # Heads-up display
│   │   ├── BuildMenu.ts           # Building selection
│   │   ├── CraftingUI.ts          # Crafting interface
│   │   └── InventoryUI.ts         # Inventory display
│   ├── utils/
│   │   ├── api-client.ts          # API integration
│   │   ├── asset-loader.ts        # Asset loading utilities
│   │   └── storage.ts             # Local storage wrapper
│   └── types/
│       ├── game-types.ts          # Game-specific types
│       └── asset-types.ts         # Asset definitions
├── assets/                        # Local development assets
│   ├── sprites/                   # Sprite sheets
│   ├── tilesets/                  # Tileset images
│   ├── ui/                        # UI elements
│   └── audio/                     # Sound effects & music
└── public/
    └── manifest.json              # Asset manifest for production
```

---

## 🎯 **Asset Access Strategy**

### **1. Asset Manifest System**

Create `src/config/asset-manifest.ts`:
```typescript
export interface AssetDefinition {
  key: string;
  type: 'image' | 'spritesheet' | 'audio' | 'json';
  url: string;
  fallback?: string;
  metadata?: {
    frameWidth?: number;
    frameHeight?: number;
    frames?: number;
  };
}

export const ASSET_MANIFEST: AssetDefinition[] = [
  // Sprites from main game
  {
    key: 'player-warrior',
    type: 'spritesheet',
    url: '/sprites/characters/warrior.png',
    fallback: 'https://cdn.puter.com/grudge/sprites/warrior.png',
    metadata: { frameWidth: 32, frameHeight: 32, frames: 12 }
  },
  // Items from inventory
  {
    key: 'item-sword',
    type: 'image',
    url: '/sprites/items/sword.png',
    fallback: 'https://cdn.puter.com/grudge/items/sword.png'
  },
  // Buildings
  {
    key: 'building-forge',
    type: 'image',
    url: '/sprites/buildings/forge.png',
    fallback: 'https://cdn.puter.com/grudge/buildings/forge.png'
  }
];
```

### **2. Asset Manager with Fallbacks**

Create `src/systems/AssetManager.ts`:
```typescript
import { ASSET_MANIFEST, AssetDefinition } from '../config/asset-manifest';

export class AssetManager {
  private loadedAssets = new Map<string, any>();
  private failedAssets = new Set<string>();

  async loadAsset(key: string): Promise<any> {
    // Check cache first
    if (this.loadedAssets.has(key)) {
      return this.loadedAssets.get(key);
    }

    const asset = ASSET_MANIFEST.find(a => a.key === key);
    if (!asset) {
      console.error(`Asset not found: ${key}`);
      return null;
    }

    try {
      // Try primary URL
      const loaded = await this.fetchAsset(asset.url, asset.type);
      this.loadedAssets.set(key, loaded);
      return loaded;
    } catch (error) {
      console.warn(`Failed to load ${asset.url}, trying fallback...`);
      
      if (asset.fallback) {
        try {
          const loaded = await this.fetchAsset(asset.fallback, asset.type);
          this.loadedAssets.set(key, loaded);
          return loaded;
        } catch (fallbackError) {
          console.error(`Failed to load fallback for ${key}`);
          this.failedAssets.add(key);
          return null;
        }
      }
    }
  }

  private async fetchAsset(url: string, type: string): Promise<any> {
    // Implementation depends on your game engine (Phaser, PixiJS, etc.)
    // This is a generic example
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    switch (type) {
      case 'image':
      case 'spritesheet':
        return await this.loadImage(url);
      case 'json':
        return await response.json();
      case 'audio':
        return await this.loadAudio(url);
      default:
        throw new Error(`Unknown asset type: ${type}`);
    }
  }

  async loadAll(): Promise<void> {
    const promises = ASSET_MANIFEST.map(asset => 
      this.loadAsset(asset.key).catch(err => {
        console.error(`Failed to load ${asset.key}:`, err);
      })
    );
    await Promise.all(promises);
  }
}
```

### **3. API Integration**

Create `src/utils/api-client.ts`:
```typescript
import api from '@/lib/api'; // Import from main app

export class GameAPI {
  // Get character data
  async getCharacter(characterId: string) {
    return await api.call(`/api/characters/${characterId}`);
  }

  // Get inventory
  async getInventory(characterId: string) {
    return await api.call(`/api/inventory/${characterId}`);
  }

  // Get crafting recipes
  async getRecipes(characterId: string) {
    return await api.call(`/api/recipes/unlocked/${characterId}`);
  }

  // Save game state
  async saveGameState(characterId: string, state: any) {
    return await api.call('/api/game/save', {
      method: 'POST',
      body: JSON.stringify({ characterId, state })
    });
  }

  // Load game state
  async loadGameState(characterId: string) {
    return await api.call(`/api/game/load/${characterId}`);
  }
}
```

---

## 🚀 **Best Practices**

### **1. Asset Loading**
- ✅ Use asset manifest for centralized management
- ✅ Implement fallback URLs (CDN → local)
- ✅ Cache loaded assets in memory
- ✅ Show loading progress to user
- ✅ Handle missing assets gracefully

### **2. Data Access**
- ✅ Use shared API client from main app
- ✅ Cache API responses locally
- ✅ Implement offline mode with local storage
- ✅ Sync state on reconnection

### **3. Performance**
- ✅ Lazy load assets (load on demand)
- ✅ Use sprite atlases to reduce HTTP requests
- ✅ Implement asset preloading for critical resources
- ✅ Use Web Workers for heavy computations

### **4. State Management**
- ✅ Separate game state from UI state
- ✅ Implement auto-save every 30 seconds
- ✅ Store state in IndexedDB for persistence
- ✅ Sync with backend periodically

---

## 📦 **Integration with Main App**

### **Shared Resources:**

```typescript
// Import from main app
import { Character } from '@shared/schema';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Use in game mode
const character = await api.call('/api/characters/123');
const inventory = await api.call('/api/inventory/123');
```

### **Asset Sharing:**

```typescript
// Reference main app assets
const assetUrl = `/sprites/items/${itemId}.png`;

// Or use CDN
const cdnUrl = `https://cdn.puter.com/grudge/items/${itemId}.png`;
```

---

**Ready to create the folder structure? Let me know!** 🎮
