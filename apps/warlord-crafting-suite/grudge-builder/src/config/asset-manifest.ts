/**
 * Asset Manifest
 * Centralized registry of all game assets with fallback URLs
 */

export interface AssetDefinition {
  key: string;
  type: 'image' | 'spritesheet' | 'audio' | 'json' | 'tilemap';
  url: string;
  fallback?: string;
  metadata?: {
    frameWidth?: number;
    frameHeight?: number;
    frames?: number;
  };
}

/**
 * Asset sources:
 * 1. Local /assets (development)
 * 2. Main app /public/sprites (shared)
 * 3. CDN (production fallback)
 */
export const ASSET_MANIFEST: AssetDefinition[] = [
  // Player sprites
  {
    key: 'player-warrior',
    type: 'spritesheet',
    url: '/assets/sprites/player-warrior.png',
    fallback: 'https://cdn.puter.com/grudge/sprites/warrior.png',
    metadata: { frameWidth: 32, frameHeight: 32, frames: 12 },
  },
  
  // Buildings
  {
    key: 'building-forge',
    type: 'image',
    url: '/assets/buildings/forge.png',
    fallback: 'https://cdn.puter.com/grudge/buildings/forge.png',
  },
  {
    key: 'building-workshop',
    type: 'image',
    url: '/assets/buildings/workshop.png',
    fallback: 'https://cdn.puter.com/grudge/buildings/workshop.png',
  },
  {
    key: 'building-storage',
    type: 'image',
    url: '/assets/buildings/storage.png',
    fallback: 'https://cdn.puter.com/grudge/buildings/storage.png',
  },
  
  // Resources
  {
    key: 'resource-wood',
    type: 'image',
    url: '/assets/resources/wood.png',
    fallback: 'https://cdn.puter.com/grudge/resources/wood.png',
  },
  {
    key: 'resource-stone',
    type: 'image',
    url: '/assets/resources/stone.png',
    fallback: 'https://cdn.puter.com/grudge/resources/stone.png',
  },
  {
    key: 'resource-iron',
    type: 'image',
    url: '/assets/resources/iron.png',
    fallback: 'https://cdn.puter.com/grudge/resources/iron.png',
  },
  
  // Tilesets
  {
    key: 'tileset-ground',
    type: 'image',
    url: '/assets/tilesets/ground.png',
    fallback: 'https://cdn.puter.com/grudge/tilesets/ground.png',
  },
  
  // UI
  {
    key: 'ui-button',
    type: 'image',
    url: '/assets/ui/button.png',
  },
  {
    key: 'ui-panel',
    type: 'image',
    url: '/assets/ui/panel.png',
  },
  
  // Audio
  {
    key: 'sfx-build',
    type: 'audio',
    url: '/assets/audio/build.mp3',
  },
  {
    key: 'sfx-collect',
    type: 'audio',
    url: '/assets/audio/collect.mp3',
  },
  {
    key: 'music-ambient',
    type: 'audio',
    url: '/assets/audio/ambient.mp3',
  },
];

/**
 * Get asset by key
 */
export function getAsset(key: string): AssetDefinition | undefined {
  return ASSET_MANIFEST.find(asset => asset.key === key);
}

/**
 * Get all assets of a specific type
 */
export function getAssetsByType(type: AssetDefinition['type']): AssetDefinition[] {
  return ASSET_MANIFEST.filter(asset => asset.type === type);
}

/**
 * Get asset URL with fallback
 */
export function getAssetUrl(key: string, useFallback = false): string | undefined {
  const asset = getAsset(key);
  if (!asset) return undefined;
  return useFallback && asset.fallback ? asset.fallback : asset.url;
}

