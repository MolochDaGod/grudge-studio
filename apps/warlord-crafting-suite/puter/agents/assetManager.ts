/**
 * GRUDGE Asset Manager Agent
 * 
 * Best Practices for Puter.js:
 * - In browser context: use global `puter` object
 * - In worker context: use `me.puter` for developer resources
 * - ALWAYS use JSON.stringify() when storing objects in KV
 * - ALWAYS use JSON.parse() when reading objects from KV
 * - Use consistent key prefixes: grudge_asset_, grudge_analysis_, etc.
 */

declare const puter: {
  ai: {
    chat: (messages: string | Array<{ role: string; content: string }>, options?: Record<string, unknown>) => Promise<{ message?: { content?: string } } | string>;
  };
  fs: {
    write: (path: string, content: string | Blob, options?: { createMissingParents?: boolean }) => Promise<{ path: string }>;
    read: (path: string) => Promise<Blob>;
    delete: (path: string) => Promise<void>;
    mkdir: (path: string, options?: { createMissingParents?: boolean }) => Promise<void>;
    readdir: (path: string) => Promise<Array<{ name: string; is_dir: boolean }>>;
  };
  kv: {
    set: (key: string, value: string) => Promise<void>;
    get: (key: string) => Promise<string | null>;
    del: (key: string) => Promise<void>;
    list: (pattern?: string, includeValues?: boolean) => Promise<string[] | Array<{ key: string; value: string }>>;
  };
};

declare const me: { puter: typeof puter } | undefined;

function getPuter(): typeof puter {
  if (typeof me !== 'undefined' && me?.puter) {
    return me.puter;
  }
  return puter;
}

export interface AssetAnalysis {
  type: 'sprite' | 'texture' | 'icon' | 'background' | 'ui' | 'unknown';
  dimensions: { width: number; height: number };
  format: string;
  fileSize: number;
  suggestedPath: string;
  metadata: Record<string, unknown>;
}

export interface ImportResult {
  success: boolean;
  path: string;
  error?: string;
}

export class AssetManagerAgent {
  private cloudBasePath: string;
  private kvPrefix: string;
  private p: typeof puter;
  
  constructor(cloudBasePath = '/grudge-warlords/assets') {
    this.cloudBasePath = cloudBasePath;
    this.kvPrefix = 'grudge_asset_';
    this.p = getPuter();
  }

  async analyzeAsset(imageData: string | Blob): Promise<AssetAnalysis> {
    try {
      const prompt = `Analyze this game asset image and provide:
1. Asset type (sprite, texture, icon, background, ui element)
2. Suggested category (weapons, armor, characters, items, effects, environments)
3. Quality assessment (low, medium, high, professional)
4. Transparency support (yes/no)
5. Animation potential (static, animated, sprite-sheet)
6. Suggested file naming convention
7. Best use case in a fantasy RPG game

Respond in JSON format with keys: type, category, quality, hasTransparency, animationType, suggestedName, useCase`;

      const response = await this.p.ai.chat([
        { role: 'system', content: 'You are a game asset analyst for GRUDGE Warlords, a fantasy RPG.' },
        { role: 'user', content: prompt }
      ]);

      const rawContent = typeof response === 'string' ? response : response.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || '{}';
      const analysis = JSON.parse(content);

      return {
        type: analysis.type || 'unknown',
        dimensions: { width: 0, height: 0 },
        format: 'png',
        fileSize: 0,
        suggestedPath: `${this.cloudBasePath}/${analysis.category || 'misc'}/${analysis.suggestedName || 'asset'}.png`,
        metadata: analysis
      };
    } catch (error) {
      console.error('Asset analysis failed:', error);
      return {
        type: 'unknown',
        dimensions: { width: 0, height: 0 },
        format: 'unknown',
        fileSize: 0,
        suggestedPath: `${this.cloudBasePath}/misc/unknown.png`,
        metadata: { error: String(error) }
      };
    }
  }

  async importAsset(
    source: string | Blob,
    targetPath?: string,
    metadata?: Record<string, unknown>
  ): Promise<ImportResult> {
    try {
      const path = targetPath || `${this.cloudBasePath}/imports/${Date.now()}.png`;
      
      const parentDir = path.substring(0, path.lastIndexOf('/'));
      try {
        await this.p.fs.mkdir(parentDir, { createMissingParents: true });
      } catch {
      }

      await this.p.fs.write(path, source);

      if (metadata) {
        const metaPath = path.replace(/\.[^.]+$/, '.meta.json');
        await this.p.fs.write(metaPath, JSON.stringify(metadata, null, 2));
        
        const metaKey = this.kvPrefix + 'meta_' + path.replace(/[^a-zA-Z0-9]/g, '_');
        await this.p.kv.set(metaKey, JSON.stringify(metadata));
      }

      return { success: true, path };
    } catch (error) {
      return { success: false, path: '', error: String(error) };
    }
  }

  async listAssets(category?: string): Promise<string[]> {
    try {
      const searchPath = category 
        ? `${this.cloudBasePath}/${category}`
        : this.cloudBasePath;
      
      const items = await this.p.fs.readdir(searchPath);
      return items
        .filter(item => !item.is_dir && !item.name.endsWith('.meta.json'))
        .map(item => `${searchPath}/${item.name}`);
    } catch (error) {
      console.error('Failed to list assets:', error);
      return [];
    }
  }

  async organizeAssets(): Promise<{ moved: number; errors: string[] }> {
    const errors: string[] = [];
    let moved = 0;

    try {
      const unorganized = await this.listAssets('imports');
      
      for (const assetPath of unorganized) {
        try {
          const blob = await this.p.fs.read(assetPath);
          const analysis = await this.analyzeAsset(blob);
          
          if (analysis.suggestedPath !== assetPath) {
            await this.p.fs.write(analysis.suggestedPath, blob);
            await this.p.fs.delete(assetPath);
            moved++;
          }
        } catch (error) {
          errors.push(`Failed to organize ${assetPath}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Organization failed: ${error}`);
    }

    return { moved, errors };
  }

  async generateAssetCatalog(): Promise<Record<string, string[]>> {
    const catalog: Record<string, string[]> = {};
    const categories = ['weapons', 'armor', 'characters', 'items', 'effects', 'environments', 'ui', 'misc'];

    for (const category of categories) {
      catalog[category] = await this.listAssets(category);
    }

    await this.p.fs.write(
      `${this.cloudBasePath}/catalog.json`,
      JSON.stringify(catalog, null, 2)
    );
    
    await this.p.kv.set(this.kvPrefix + 'catalog', JSON.stringify(catalog));

    return catalog;
  }

  async analyzeSprite(imagePath: string): Promise<{
    frameCount: number;
    frameWidth: number;
    frameHeight: number;
    animations: string[];
    suggestedConfig: Record<string, unknown>;
  }> {
    try {
      const prompt = `Analyze this sprite sheet for a fantasy RPG game.
Determine:
1. Total frame count (rows × columns)
2. Individual frame dimensions
3. Animation sequences present (idle, walk, attack, etc.)
4. Animation frame counts per sequence
5. Suggested frame rate for each animation

Respond in JSON with: frameCount, frameWidth, frameHeight, rows, columns, animations (array of {name, startFrame, endFrame, frameRate})`;

      const response = await this.p.ai.chat([
        { role: 'system', content: 'You are a sprite sheet analyzer for GRUDGE Warlords game engine.' },
        { role: 'user', content: prompt }
      ]);

      const content = typeof response === 'string' ? response : (response.message?.content || '{}');
      const result = JSON.parse(content);

      return {
        frameCount: result.frameCount || 1,
        frameWidth: result.frameWidth || 64,
        frameHeight: result.frameHeight || 64,
        animations: result.animations?.map((a: { name: string }) => a.name) || ['idle'],
        suggestedConfig: result
      };
    } catch (error) {
      return {
        frameCount: 1,
        frameWidth: 64,
        frameHeight: 64,
        animations: ['idle'],
        suggestedConfig: { error: String(error) }
      };
    }
  }
}

// Usage: const assetManager = new AssetManagerAgent(); (only in Puter browser context)
