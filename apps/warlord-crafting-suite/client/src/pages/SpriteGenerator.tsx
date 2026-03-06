import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isPuterAvailable, getPuter } from '@/lib/puter';
import { CRAFTING_MATERIALS } from '@/data/materials';
import { SWORDS, AXES, HAMMERS_1H, HAMMERS_2H, BOWS, STAVES, DAGGERS, GREATSWORDS, GREATAXES, CROSSBOWS, GUNS } from '@/data/weapons';

interface GeneratedSprite {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  cloudPath: string | null;
  status: 'pending' | 'generating' | 'success' | 'failed';
}

const STYLE_PROMPTS: Record<string, string> = {
  pixel: 'pixel art style, 16-bit RPG game sprite, transparent background, centered, clean edges, vibrant colors',
  painted: 'hand-painted fantasy game art, detailed textures, soft lighting, game icon style, transparent background',
  flat: 'flat vector icon style, clean lines, solid colors, game UI icon, transparent background, minimalist',
  realistic: 'semi-realistic fantasy game art, detailed rendering, dramatic lighting, game inventory icon style'
};

const CATEGORY_PROMPTS: Record<string, string> = {
  weapon: 'fantasy RPG weapon, single item, no hands or characters, game inventory icon',
  Sword: 'fantasy RPG sword, sharp blade, ornate hilt, game inventory icon, single weapon',
  Axe: 'fantasy RPG battle axe, curved blade, wooden handle, game inventory icon',
  Hammer: 'fantasy RPG war hammer, heavy head, long handle, game inventory icon',
  Bow: 'fantasy RPG bow, curved limbs, taut string, game inventory icon',
  Staff: 'fantasy RPG magical staff, glowing crystal top, wooden shaft, game inventory icon',
  Dagger: 'fantasy RPG dagger, short blade, leather grip, game inventory icon',
  Greatsword: 'fantasy RPG greatsword, massive two-handed blade, game inventory icon',
  Greataxe: 'fantasy RPG greataxe, enormous double-headed axe, game inventory icon',
  Crossbow: 'fantasy RPG crossbow, mechanical trigger, loaded bolt, game inventory icon',
  Gun: 'fantasy steampunk flintlock pistol, ornate barrel, game inventory icon',
  ore: 'fantasy RPG ore chunk, mining resource, crystalline, game inventory icon',
  wood: 'fantasy RPG wooden log, forestry resource, natural texture, game inventory icon',
  cloth: 'fantasy RPG fabric roll, weaving material, soft texture, game inventory icon',
  essence: 'fantasy RPG magical essence orb, glowing energy, mystical, game inventory icon',
  gem: 'fantasy RPG gemstone, cut crystal, brilliant facets, game inventory icon',
  leather: 'fantasy RPG leather hide, animal skin, tanned texture, game inventory icon',
  ingredient: 'fantasy RPG cooking ingredient, food item, fresh, game inventory icon',
  component: 'fantasy RPG crafting component, processed material, game inventory icon',
  infusion: 'fantasy RPG magical infusion, glowing liquid, enchanted, game inventory icon'
};

const MODEL_OPTIONS = [
  { value: 'black-forest-labs/FLUX.1-schnell', label: 'FLUX.1 Schnell (Fast)' },
  { value: 'black-forest-labs/FLUX.2-pro', label: 'FLUX.2 Pro (Quality)' },
  { value: 'dall-e-3', label: 'DALL-E 3' }
];

const STYLE_OPTIONS = [
  { value: 'pixel', label: 'Pixel Art (16-bit)' },
  { value: 'painted', label: 'Hand-Painted' },
  { value: 'flat', label: 'Flat Icon' },
  { value: 'realistic', label: 'Semi-Realistic' }
];

interface WeaponBase {
  id: string;
  name: string;
  type: string;
}

const ALL_WEAPONS = [
  ...SWORDS.map((w: WeaponBase) => ({ ...w, category: 'Sword' })),
  ...AXES.map((w: WeaponBase) => ({ ...w, category: 'Axe' })),
  ...HAMMERS_1H.map((w: WeaponBase) => ({ ...w, category: 'Hammer' })),
  ...HAMMERS_2H.map((w: WeaponBase) => ({ ...w, category: 'Hammer' })),
  ...BOWS.map((w: WeaponBase) => ({ ...w, category: 'Bow' })),
  ...STAVES.map((w: WeaponBase) => ({ ...w, category: 'Staff' })),
  ...DAGGERS.map((w: WeaponBase) => ({ ...w, category: 'Dagger' })),
  ...GREATSWORDS.map((w: WeaponBase) => ({ ...w, category: 'Greatsword' })),
  ...GREATAXES.map((w: WeaponBase) => ({ ...w, category: 'Greataxe' })),
  ...CROSSBOWS.map((w: WeaponBase) => ({ ...w, category: 'Crossbow' })),
  ...GUNS.map((w: WeaponBase) => ({ ...w, category: 'Gun' }))
];

export default function SpriteGenerator() {
  const [sprites, setSprites] = useState<GeneratedSprite[]>([]);
  const [logs, setLogs] = useState<string[]>(['Ready. Puter AI sprite generation available.']);
  const [style, setStyle] = useState('pixel');
  const [model, setModel] = useState('black-forest-labs/FLUX.1-schnell');
  const [itemType, setItemType] = useState<'weapons' | 'materials'>('weapons');
  const [customItem, setCustomItem] = useState('');
  const [batchSize, setBatchSize] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const log = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  }, []);

  const buildPrompt = useCallback((itemName: string, category: string) => {
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.pixel;
    const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.weapon;
    return `${itemName}, ${categoryPrompt}, ${stylePrompt}, high quality, game asset, isolated on transparent background`;
  }, [style]);

  const generateSingleSprite = async (itemName: string, itemId: string, category: string): Promise<GeneratedSprite> => {
    if (!isPuterAvailable()) {
      log('Puter not available');
      return { id: itemId, name: itemName, category, imageUrl: null, cloudPath: null, status: 'failed' };
    }

    const puter = getPuter();
    const prompt = buildPrompt(itemName, category);
    
    log(`Generating: ${itemName}...`);

    try {
      const img = await puter.ai.txt2img(prompt, { model });
      const imageUrl = img.src;

      log(`✓ Generated: ${itemName}`);
      
      return {
        id: itemId,
        name: itemName,
        category,
        imageUrl,
        cloudPath: null,
        status: 'success'
      };
    } catch (error) {
      log(`✗ Failed: ${itemName} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { id: itemId, name: itemName, category, imageUrl: null, cloudPath: null, status: 'failed' };
    }
  };

  const handleGenerateSingle = async () => {
    if (!customItem.trim()) {
      log('Please enter an item name');
      return;
    }

    setIsGenerating(true);
    const itemId = customItem.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const result = await generateSingleSprite(customItem, itemId, itemType === 'weapons' ? 'weapon' : 'material');
    setSprites(prev => [result, ...prev]);
    setIsGenerating(false);
  };

  const handleGenerateBatch = async () => {
    setIsGenerating(true);
    setProgress(0);

    const items = itemType === 'weapons' 
      ? ALL_WEAPONS.slice(0, batchSize).map(w => ({ id: w.id, name: w.name, category: w.category }))
      : CRAFTING_MATERIALS.slice(0, batchSize).map(m => ({ id: m.id, name: m.name, category: m.category }));

    log(`Starting batch generation: ${items.length} items`);

    const results: GeneratedSprite[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setProgress(((i + 1) / items.length) * 100);
      
      const result = await generateSingleSprite(item.name, item.id, item.category);
      results.push(result);
      setSprites(prev => [...results]);

      if (i < items.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    log(`Batch complete! ${results.filter(r => r.status === 'success').length}/${items.length} succeeded`);
    setIsGenerating(false);
  };

  const handleSaveToCloud = async (sprite: GeneratedSprite) => {
    if (!sprite.imageUrl || !isPuterAvailable()) return;

    const puter = getPuter();
    log(`Saving ${sprite.name} to Puter cloud...`);

    try {
      const response = await fetch(sprite.imageUrl);
      const blob = await response.blob();
      
      const filename = `${sprite.id}.png`;
      const path = `/grudge-warlords/sprites/${sprite.category}/${filename}`;
      
      await puter.fs.write(path, blob, { createMissingParents: true });
      
      setSprites(prev => prev.map(s => 
        s.id === sprite.id ? { ...s, cloudPath: path } : s
      ));
      
      log(`✓ Saved: ${path}`);
    } catch (error) {
      log(`✗ Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportAll = async () => {
    const successSprites = sprites.filter(s => s.status === 'success' && s.imageUrl);
    log(`Exporting ${successSprites.length} sprites to cloud...`);

    for (const sprite of successSprites) {
      if (!sprite.cloudPath) {
        await handleSaveToCloud(sprite);
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (isPuterAvailable()) {
      const puter = getPuter();
      const manifest = sprites.filter(s => s.cloudPath).map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        cloudPath: s.cloudPath
      }));

      await puter.fs.write(
        '/grudge-warlords/sprites/manifest.json',
        JSON.stringify(manifest, null, 2),
        { createMissingParents: true }
      );
      log(`✓ Manifest saved with ${manifest.length} sprites`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-black/30 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400 text-2xl">
              GRUDGE Warlords - AI Sprite Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-amber-400 mb-2 block">Item Type</label>
                <Select value={itemType} onValueChange={(v: 'weapons' | 'materials') => setItemType(v)}>
                  <SelectTrigger data-testid="select-item-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weapons">Weapons ({ALL_WEAPONS.length})</SelectItem>
                    <SelectItem value="materials">Materials ({CRAFTING_MATERIALS.length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-amber-400 mb-2 block">Art Style</label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger data-testid="select-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-amber-400 mb-2 block">AI Model</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger data-testid="select-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-amber-400 mb-2 block">Batch Size</label>
                <Input 
                  type="number" 
                  value={batchSize} 
                  onChange={e => setBatchSize(Number(e.target.value))}
                  min={1}
                  max={50}
                  data-testid="input-batch-size"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Input 
                placeholder="Custom item name (e.g., Bloodfeud Blade, Copper Ore...)"
                value={customItem}
                onChange={e => setCustomItem(e.target.value)}
                className="flex-1"
                data-testid="input-custom-item"
              />
              <Button 
                onClick={handleGenerateSingle}
                disabled={isGenerating || !customItem.trim()}
                data-testid="button-generate-single"
              >
                Generate Single
              </Button>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleGenerateBatch}
                disabled={isGenerating}
                className="flex-1"
                data-testid="button-generate-batch"
              >
                Generate Batch ({batchSize} items)
              </Button>
              <Button 
                onClick={handleExportAll}
                disabled={isGenerating || sprites.filter(s => s.status === 'success').length === 0}
                variant="outline"
                data-testid="button-export-all"
              >
                Export to Cloud
              </Button>
            </div>

            {isGenerating && (
              <Progress value={progress} className="h-2" />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-black/30 border-amber-500/30 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-amber-400">Generated Sprites ({sprites.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sprites.map((sprite, idx) => (
                    <div 
                      key={`${sprite.id}-${idx}`}
                      className="bg-black/40 rounded-lg p-3 text-center border border-amber-500/20"
                    >
                      {sprite.imageUrl ? (
                        <img 
                          src={sprite.imageUrl} 
                          alt={sprite.name}
                          className="w-full h-24 object-contain bg-black/50 rounded mb-2"
                        />
                      ) : (
                        <div className="w-full h-24 bg-black/50 rounded mb-2 flex items-center justify-center text-gray-500">
                          {sprite.status === 'generating' ? '...' : '✗'}
                        </div>
                      )}
                      <div className="text-sm font-medium text-amber-300 truncate">{sprite.name}</div>
                      <div className="text-xs text-gray-500">{sprite.category}</div>
                      <Badge 
                        variant={sprite.status === 'success' ? 'default' : 'destructive'}
                        className="mt-1"
                      >
                        {sprite.cloudPath ? 'Saved' : sprite.status}
                      </Badge>
                      {sprite.status === 'success' && !sprite.cloudPath && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleSaveToCloud(sprite)}
                          className="mt-1 text-xs"
                        >
                          Save
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-amber-400">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="font-mono text-xs space-y-1">
                  {logs.map((log, idx) => (
                    <div key={idx} className="text-gray-400">{log}</div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
