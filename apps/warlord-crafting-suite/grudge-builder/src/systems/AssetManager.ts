/**
 * Asset Manager
 * Handles loading assets with fallback support
 */

import Phaser from 'phaser';
import { ASSET_MANIFEST, AssetDefinition } from '../config/asset-manifest';

export class AssetManager {
  private scene: Phaser.Scene;
  private loadedAssets = new Set<string>();
  private failedAssets = new Set<string>();
  private onProgress?: (progress: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Load all assets from manifest
   */
  async loadAll(onProgress?: (progress: number) => void): Promise<void> {
    this.onProgress = onProgress;
    
    return new Promise((resolve, reject) => {
      const loader = this.scene.load;
      
      // Setup progress tracking
      loader.on('progress', (value: number) => {
        this.onProgress?.(value);
      });

      loader.on('complete', () => {
        console.log(`✅ Loaded ${this.loadedAssets.size} assets`);
        if (this.failedAssets.size > 0) {
          console.warn(`⚠️ Failed to load ${this.failedAssets.size} assets:`, 
            Array.from(this.failedAssets));
        }
        resolve();
      });

      loader.on('loaderror', (file: any) => {
        console.error(`Failed to load: ${file.key}`);
        this.failedAssets.add(file.key);
        
        // Try fallback if available
        const asset = ASSET_MANIFEST.find(a => a.key === file.key);
        if (asset?.fallback) {
          console.log(`Trying fallback for ${file.key}...`);
          this.loadAsset(asset, true);
        }
      });

      // Load all assets
      ASSET_MANIFEST.forEach(asset => {
        this.loadAsset(asset);
      });

      // Start loading
      loader.start();
    });
  }

  /**
   * Load a single asset
   */
  private loadAsset(asset: AssetDefinition, useFallback = false): void {
    const url = useFallback && asset.fallback ? asset.fallback : asset.url;
    const loader = this.scene.load;

    try {
      switch (asset.type) {
        case 'image':
          loader.image(asset.key, url);
          break;

        case 'spritesheet':
          if (!asset.metadata) {
            console.error(`Spritesheet ${asset.key} missing metadata`);
            return;
          }
          loader.spritesheet(asset.key, url, {
            frameWidth: asset.metadata.frameWidth!,
            frameHeight: asset.metadata.frameHeight!,
          });
          break;

        case 'audio':
          loader.audio(asset.key, url);
          break;

        case 'json':
          loader.json(asset.key, url);
          break;

        case 'tilemap':
          loader.tilemapTiledJSON(asset.key, url);
          break;

        default:
          console.warn(`Unknown asset type: ${asset.type}`);
      }

      this.loadedAssets.add(asset.key);
    } catch (error) {
      console.error(`Error loading ${asset.key}:`, error);
      this.failedAssets.add(asset.key);
    }
  }

  /**
   * Check if asset is loaded
   */
  isLoaded(key: string): boolean {
    return this.loadedAssets.has(key) && !this.failedAssets.has(key);
  }

  /**
   * Get loading stats
   */
  getStats() {
    return {
      total: ASSET_MANIFEST.length,
      loaded: this.loadedAssets.size,
      failed: this.failedAssets.size,
      progress: this.loadedAssets.size / ASSET_MANIFEST.length,
    };
  }
}

