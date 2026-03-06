/**
 * GRUDGE Warlords Sprite Generator Worker
 * 
 * Serverless AI sprite generation using Puter's FLUX model.
 * Deploy with: puter worker:create grudge-sprites ./puter/workers/sprite-generator.js
 */

const STYLE_PROMPT = "2D game sprite, pixel art style, 64x64 icon, fantasy RPG item, clean bold dark outline, centered, floating item, NO BACKGROUND COLOR, pure transparent background only, single object, no shadows, no ground, no scenery";

const CATEGORY_PROMPTS = {
  ore: "rough mineral ore, mining resource, raw gemstone cluster",
  wood: "natural tree log, lumber wood, forest resource",
  plank: "refined wooden plank, processed lumber, smooth wood board, carpentry material",
  component: "refined metal ingot, forged bar, smelted material",
  essence: "magical essence orb, glowing arcane energy, mystical floating crystal",
  gem: "precious gemstone, cut jewel, sparkling crystal",
  leather: "animal hide, tanned leather, crafting material",
  thread: "spool of thread, textile fiber, weaving material",
  cloth: "folded fabric, woven cloth, textile material",
  gear: "mechanical gear, clockwork cog, engineering component",
  meat: "raw meat cut, butcher meat, cooking ingredient",
  fish: "fresh fish, seafood, fishing catch",
  ingredient: "cooking ingredient, food item, kitchen supply",
  infusion: "magical infusion, elemental essence, enchanting reagent",
  sword: "fantasy sword blade, one-handed weapon, steel longsword",
  axe: "fantasy battle axe, one-handed chopping weapon",
  greatsword: "massive two-handed greatsword, heavy blade weapon",
  greataxe: "huge two-handed greataxe, heavy chopping weapon",
  bow: "wooden longbow, ranged weapon with string",
  crossbow: "mechanical crossbow, ranged bolt weapon",
  gun: "fantasy firearm, gunpowder weapon, pistol or rifle",
  staff: "magical wizard staff, spellcasting weapon with crystal",
  tome: "magical spellbook, leather-bound grimoire, arcane tome",
  dagger: "short stabbing blade, assassin knife, throwing dagger",
  hammer: "war hammer, blunt weapon, heavy mace",
  shield: "defensive shield, armor barrier, coat of arms",
  potion: "glass potion bottle, magical elixir, colorful liquid",
};

function buildPrompt(itemName, category) {
  const categoryPrompt = CATEGORY_PROMPTS[category] || "fantasy RPG game item";
  return `${itemName}, ${categoryPrompt}, ${STYLE_PROMPT}`;
}

// Authentication helper
function requireAuth(request) {
  const authHeader = request.headers.get('Authorization') || 
                     request.headers.get('puter-auth');
  return !!authHeader;
}

// Health check (public)
router.get('/api/health', async () => {
  return {
    status: 'ok',
    service: 'GRUDGE Sprite Generator',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    capabilities: ['txt2img', 'batch-generation', 'cloud-storage']
  };
});

// Generate a single sprite
router.post('/api/generate', async (event) => {
  try {
    const body = await event.request.json();
    const { id, name, category } = body;
    
    if (!id || !name || !category) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: id, name, category' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const prompt = buildPrompt(name, category);
    console.log(`Generating sprite: ${name} (${category})`);
    console.log(`Prompt: ${prompt}`);
    
    // Generate image using Puter AI (use me.puter in workers)
    const imageBlob = await me.puter.ai.txt2img(prompt, false, { 
      model: 'flux-schnell'
    });
    
    // Save to Puter cloud storage
    const spritePath = `/grudge-warlords/sprites/${category}/${id}.png`;
    await me.puter.fs.write(spritePath, imageBlob, { createMissingParents: true });
    
    // Return the generated sprite URL
    return {
      success: true,
      id,
      name,
      category,
      path: spritePath,
      prompt,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Generation error:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      message: 'Failed to generate sprite'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Generate a batch of sprites
router.post('/api/generate-batch', async (event) => {
  try {
    const body = await event.request.json();
    const { items, delayMs = 2500 } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Missing or empty items array' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Limit batch size
    const batchItems = items.slice(0, 10);
    const results = [];
    
    for (const item of batchItems) {
      try {
        const prompt = buildPrompt(item.name, item.category);
        console.log(`Generating: ${item.name}`);
        
        const imageBlob = await me.puter.ai.txt2img(prompt, false, { 
          model: 'flux-schnell'
        });
        
        const spritePath = `/grudge-warlords/sprites/${item.category}/${item.id}.png`;
        await me.puter.fs.write(spritePath, imageBlob, { createMissingParents: true });
        
        results.push({
          id: item.id,
          name: item.name,
          status: 'success',
          path: spritePath
        });
        
        // Rate limit delay between generations
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        results.push({
          id: item.id,
          name: item.name,
          status: 'failed',
          error: String(error)
        });
      }
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    return {
      success: true,
      total: batchItems.length,
      successful,
      failed,
      results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: String(error),
      message: 'Batch generation failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// List available sprites in cloud storage
router.get('/api/sprites/:category', async (event) => {
  try {
    const { category } = event.params;
    const spritePath = `/grudge-warlords/sprites/${category}`;
    
    const items = await me.puter.fs.readdir(spritePath);
    const sprites = items
      .filter(item => !item.is_dir && item.name.endsWith('.png'))
      .map(item => ({
        id: item.name.replace('.png', ''),
        name: item.name,
        path: `${spritePath}/${item.name}`
      }));
    
    return {
      success: true,
      category,
      count: sprites.length,
      sprites
    };
  } catch (error) {
    return {
      success: true,
      category: event.params.category,
      count: 0,
      sprites: []
    };
  }
});

// List all sprite categories
router.get('/api/sprites', async () => {
  try {
    const basePath = '/grudge-warlords/sprites';
    const items = await me.puter.fs.readdir(basePath);
    const categories = items
      .filter(item => item.is_dir)
      .map(item => item.name);
    
    return {
      success: true,
      categories
    };
  } catch (error) {
    return {
      success: true,
      categories: []
    };
  }
});

// Get sprite download URL (serves the actual image)
router.get('/api/sprite/:category/:id', async (event) => {
  try {
    const { category, id } = event.params;
    const spritePath = `/grudge-warlords/sprites/${category}/${id}.png`;
    
    const blob = await me.puter.fs.read(spritePath);
    
    return new Response(blob, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Sprite not found' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Get full manifest of all sprites in cloud
router.get('/api/manifest', async () => {
  try {
    const basePath = '/grudge-warlords/sprites';
    const manifest = {};
    let totalCount = 0;
    
    try {
      const categories = await me.puter.fs.readdir(basePath);
      
      for (const cat of categories.filter(c => c.is_dir)) {
        const catPath = `${basePath}/${cat.name}`;
        const sprites = await me.puter.fs.readdir(catPath);
        const spriteList = sprites
          .filter(s => !s.is_dir && s.name.endsWith('.png'))
          .map(s => s.name.replace('.png', ''));
        
        manifest[cat.name] = spriteList;
        totalCount += spriteList.length;
      }
    } catch (e) {
      // Base path doesn't exist yet
    }
    
    return {
      success: true,
      totalSprites: totalCount,
      categories: Object.keys(manifest).length,
      manifest,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      manifest: {}
    };
  }
});

// Sync endpoint - returns signed URLs for downloading sprites
router.get('/api/sync/:category', async (event) => {
  try {
    const { category } = event.params;
    const spritePath = `/grudge-warlords/sprites/${category}`;
    
    const items = await me.puter.fs.readdir(spritePath);
    const sprites = [];
    
    for (const item of items.filter(i => !i.is_dir && i.name.endsWith('.png'))) {
      const id = item.name.replace('.png', '');
      sprites.push({
        id,
        filename: item.name,
        path: `${spritePath}/${item.name}`,
        downloadUrl: `/api/sprite/${category}/${id}`
      });
    }
    
    return {
      success: true,
      category,
      count: sprites.length,
      sprites
    };
  } catch (error) {
    return {
      success: true,
      category: event.params.category,
      count: 0,
      sprites: []
    };
  }
});

// CORS preflight
router.options('/*page', ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: { 
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*', 
      'Access-Control-Allow-Headers': '*', 
      'Access-Control-Allow-Credentials': 'true', 
      'Access-Control-Allow-Methods': '*' 
    }
  });
});
