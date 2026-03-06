import { isPuterAvailable, getPuter } from './puter';

export interface SpriteConfig {
  style: 'pixel' | 'painted' | 'flat' | 'realistic';
  model: 'flux-schnell' | 'flux-pro' | 'dalle3';
}

const STYLE_PROMPTS: Record<string, string> = {
  pixel: 'pixel art style, 16-bit RPG game sprite, transparent background, centered, clean edges, vibrant colors',
  painted: 'hand-painted fantasy game art, detailed textures, soft lighting, game icon style, transparent background',
  flat: 'flat vector icon style, clean lines, solid colors, game UI icon, transparent background, minimalist',
  realistic: 'semi-realistic fantasy game art, detailed rendering, dramatic lighting, game inventory icon style'
};

const CATEGORY_PROMPTS: Record<string, string> = {
  weapon: 'fantasy RPG weapon, single item, no hands or characters, game inventory icon',
  material: 'fantasy RPG crafting material, raw resource, game inventory icon, single item',
  armor: 'fantasy RPG armor piece, equipment icon, game inventory style, single item',
  potion: 'fantasy RPG potion bottle, magical liquid, glowing effect, game inventory icon',
  ore: 'fantasy RPG ore chunk, mining resource, crystalline, game inventory icon',
  wood: 'fantasy RPG wooden log, forestry resource, natural texture, game inventory icon',
  cloth: 'fantasy RPG fabric roll, weaving material, soft texture, game inventory icon',
  essence: 'fantasy RPG magical essence orb, glowing energy, mystical, game inventory icon',
  gem: 'fantasy RPG gemstone, cut crystal, brilliant facets, game inventory icon',
  leather: 'fantasy RPG leather hide, animal skin, tanned texture, game inventory icon',
  ingredient: 'fantasy RPG cooking ingredient, food item, fresh, game inventory icon'
};

const MODEL_MAP: Record<string, string> = {
  'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
  'flux-pro': 'black-forest-labs/FLUX.2-pro',
  'dalle3': 'dall-e-3'
};

export function buildSpritePrompt(
  itemName: string, 
  category: string, 
  style: string = 'pixel'
): string {
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.pixel;
  const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.weapon;
  return `${itemName}, ${categoryPrompt}, ${stylePrompt}, high quality, game asset, isolated on transparent background`;
}

export async function generateSprite(
  itemName: string,
  category: string,
  config: SpriteConfig = { style: 'pixel', model: 'flux-schnell' }
): Promise<HTMLImageElement | null> {
  if (!isPuterAvailable()) {
    console.warn('Puter not available for sprite generation');
    return null;
  }

  const puter = getPuter();
  const prompt = buildSpritePrompt(itemName, category, config.style);
  const model = MODEL_MAP[config.model] || MODEL_MAP['flux-schnell'];

  try {
    const img = await puter.ai.txt2img(prompt, { model });
    return img as HTMLImageElement;
  } catch (error) {
    console.error(`Failed to generate sprite for ${itemName}:`, error);
    return null;
  }
}

export async function saveSpriteToCloud(
  img: HTMLImageElement,
  itemId: string,
  category: string
): Promise<string | null> {
  if (!isPuterAvailable()) {
    return null;
  }

  const puter = getPuter();
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 512;
    canvas.height = img.naturalHeight || 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(img, 0, 0);
    
    const blob = await new Promise<Blob | null>(resolve => 
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) return null;

    const filename = `${itemId}.png`;
    const path = `/grudge-warlords/sprites/${category}/${filename}`;
    
    await puter.fs.write(path, blob, { createMissingParents: true });
    
    return path;
  } catch (error) {
    console.error(`Failed to save sprite for ${itemId}:`, error);
    return null;
  }
}

export interface BatchGenerationResult {
  success: number;
  failed: number;
  sprites: Array<{
    id: string;
    name: string;
    category: string;
    cloudPath: string | null;
    status: 'success' | 'failed';
  }>;
}

export async function generateBatchSprites(
  items: Array<{ id: string; name: string; category: string }>,
  config: SpriteConfig,
  onProgress?: (current: number, total: number, item: string) => void
): Promise<BatchGenerationResult> {
  const result: BatchGenerationResult = {
    success: 0,
    failed: 0,
    sprites: []
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (onProgress) {
      onProgress(i + 1, items.length, item.name);
    }

    try {
      const img = await generateSprite(item.name, item.category, config);
      
      if (img) {
        const cloudPath = await saveSpriteToCloud(img, item.id, item.category);
        result.sprites.push({
          id: item.id,
          name: item.name,
          category: item.category,
          cloudPath,
          status: 'success'
        });
        result.success++;
      } else {
        result.sprites.push({
          id: item.id,
          name: item.name,
          category: item.category,
          cloudPath: null,
          status: 'failed'
        });
        result.failed++;
      }
      
      await new Promise(r => setTimeout(r, 1500));
    } catch (error) {
      result.sprites.push({
        id: item.id,
        name: item.name,
        category: item.category,
        cloudPath: null,
        status: 'failed'
      });
      result.failed++;
    }
  }

  return result;
}
