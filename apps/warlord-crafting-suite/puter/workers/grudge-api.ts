/**
 * GRUDGE Warlords Puter Worker
 * 
 * Serverless API endpoints for game data, asset management, and AI features.
 * Deploy with: puter worker:deploy grudge-api ./puter/workers/grudge-api.ts
 */

declare const puter: {
  ai: {
    chat: (messages: string | Array<{ role: string; content: string }>, options?: Record<string, unknown>) => Promise<{ message?: { content?: string } }>;
  };
  fs: {
    write: (path: string, content: string | Blob, options?: { createMissingParents?: boolean }) => Promise<{ path: string }>;
    read: (path: string) => Promise<Blob>;
    delete: (path: string) => Promise<void>;
    mkdir: (path: string) => Promise<void>;
    readdir: (path: string) => Promise<Array<{ name: string; is_dir: boolean }>>;
  };
  kv: {
    set: (key: string, value: unknown) => Promise<void>;
    get: <T = unknown>(key: string) => Promise<T | null>;
    del: (key: string) => Promise<void>;
    list: () => Promise<string[]>;
  };
};

declare const router: {
  get: (path: string, handler: (ctx: { request: Request; params: Record<string, string> }) => Promise<unknown>) => void;
  post: (path: string, handler: (ctx: { request: Request; params: Record<string, string> }) => Promise<unknown>) => void;
  put: (path: string, handler: (ctx: { request: Request; params: Record<string, string> }) => Promise<unknown>) => void;
  delete: (path: string, handler: (ctx: { request: Request; params: Record<string, string> }) => Promise<unknown>) => void;
};

const KV_PREFIX = 'grudge_';
const CLOUD_BASE = '/grudge-warlords';

router.get('/api/health', async () => {
  return {
    status: 'ok',
    service: 'GRUDGE Warlords API',
    version: '2.5.0',
    timestamp: new Date().toISOString()
  };
});

router.get('/api/data/:type', async ({ params }) => {
  const { type } = params;
  const validTypes = ['recipes', 'materials', 'weapons', 'armor', 'items', 'characters'];
  
  if (!validTypes.includes(type)) {
    return new Response(JSON.stringify({ error: `Invalid data type: ${type}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await puter.kv.get(`${KV_PREFIX}${type}`);
    return {
      success: true,
      type,
      count: Array.isArray(data) ? data.length : 0,
      data: data || []
    };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.post('/api/data/:type', async ({ request, params }) => {
  const { type } = params;
  
  try {
    const body = await request.json();
    await puter.kv.set(`${KV_PREFIX}${type}`, body.data);
    
    await puter.fs.write(
      `${CLOUD_BASE}/data/${type}.json`,
      JSON.stringify(body.data, null, 2)
    );

    return { success: true, type, saved: true };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.get('/api/assets/list/:category', async ({ params }) => {
  const { category } = params;
  
  try {
    const items = await puter.fs.readdir(`${CLOUD_BASE}/assets/${category}`);
    const assets = items
      .filter(item => !item.is_dir && !item.name.endsWith('.meta.json'))
      .map(item => ({
        name: item.name,
        path: `${CLOUD_BASE}/assets/${category}/${item.name}`
      }));
    
    return { success: true, category, count: assets.length, assets };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.get('/api/assets/catalog', async () => {
  try {
    const blob = await puter.fs.read(`${CLOUD_BASE}/assets/catalog.json`);
    const text = await blob.text();
    const catalog = JSON.parse(text);
    return { success: true, catalog };
  } catch {
    const categories = ['weapons', 'armor', 'characters', 'items', 'effects', 'environments', 'ui', 'misc'];
    const catalog: Record<string, string[]> = {};
    
    for (const category of categories) {
      try {
        const items = await puter.fs.readdir(`${CLOUD_BASE}/assets/${category}`);
        catalog[category] = items
          .filter(item => !item.is_dir)
          .map(item => item.name);
      } catch {
        catalog[category] = [];
      }
    }
    
    return { success: true, catalog };
  }
});

router.post('/api/ai/analyze-asset', async ({ request }) => {
  try {
    const body = await request.json();
    const { description } = body;

    const response = await puter.ai.chat([
      { role: 'system', content: 'You are a game asset analyst for GRUDGE Warlords, a fantasy RPG.' },
      { role: 'user', content: `Analyze this game asset: ${description}. Provide type, category, quality, and suggested usage in JSON format.` }
    ]);

    const content = response.message?.content || '{}';
    return { success: true, analysis: JSON.parse(content) };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.post('/api/ai/validate-recipe', async ({ request }) => {
  try {
    const body = await request.json();
    const { recipe } = body;

    const prompt = `Analyze this crafting recipe for GRUDGE Warlords:
${JSON.stringify(recipe, null, 2)}

Evaluate balance, tier appropriateness, and material requirements.
Respond in JSON: { isValid, issues, suggestions, balanceScore (1-10) }`;

    const response = await puter.ai.chat([
      { role: 'system', content: 'You are a game balance expert for GRUDGE Warlords crafting system.' },
      { role: 'user', content: prompt }
    ]);

    const content = response.message?.content || '{}';
    return { success: true, validation: JSON.parse(content) };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.post('/api/ai/generate-description', async ({ request }) => {
  try {
    const body = await request.json();
    const { itemName, itemType, tier } = body;

    const prompt = `Generate a compelling item description for a fantasy RPG:
- Item: ${itemName}
- Type: ${itemType}
- Tier: T${tier} (1=common, 8=legendary)

Write a 2-3 sentence description that fits a dark fantasy RPG setting.`;

    const response = await puter.ai.chat([
      { role: 'system', content: 'You are a fantasy RPG writer for GRUDGE Warlords.' },
      { role: 'user', content: prompt }
    ]);

    const content = response.message?.content || '';
    return { success: true, description: content };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.post('/api/backup/create', async ({ request }) => {
  try {
    const body = await request.json();
    const name = body.name || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = `${CLOUD_BASE}/backups/${name}`;

    await puter.fs.mkdir(backupPath);

    const allKeys = await puter.kv.list();
    const grudgeKeys = allKeys.filter(k => k.startsWith(KV_PREFIX));

    const backupData: Record<string, unknown> = {};
    for (const key of grudgeKeys) {
      backupData[key] = await puter.kv.get(key);
    }

    await puter.fs.write(
      `${backupPath}/data.json`,
      JSON.stringify(backupData, null, 2)
    );

    const manifest = {
      name,
      createdAt: new Date().toISOString(),
      keyCount: grudgeKeys.length,
      keys: grudgeKeys
    };
    await puter.fs.write(
      `${backupPath}/manifest.json`,
      JSON.stringify(manifest, null, 2)
    );

    return { success: true, path: backupPath, keyCount: grudgeKeys.length };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.get('/api/backup/list', async () => {
  try {
    const backups: { name: string; createdAt: string; keyCount: number }[] = [];
    const items = await puter.fs.readdir(`${CLOUD_BASE}/backups`);

    for (const item of items.filter(i => i.is_dir)) {
      try {
        const manifestBlob = await puter.fs.read(`${CLOUD_BASE}/backups/${item.name}/manifest.json`);
        const manifestText = await manifestBlob.text();
        const manifest = JSON.parse(manifestText);
        backups.push({
          name: manifest.name,
          createdAt: manifest.createdAt,
          keyCount: manifest.keyCount
        });
      } catch {
        // Skip invalid backups
      }
    }

    return { success: true, backups: backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  } catch (error) {
    return { success: true, backups: [] };
  }
});

router.get('/api/sync/status', async () => {
  try {
    const allKeys = await puter.kv.list();
    const grudgeKeys = allKeys.filter(k => k.startsWith(KV_PREFIX));

    const lastSync = await puter.kv.get<{ timestamp: string }>(`${KV_PREFIX}last_sync`);

    return {
      success: true,
      status: {
        kvKeyCount: grudgeKeys.length,
        lastSync: lastSync?.timestamp || null,
        cloudPath: CLOUD_BASE
      }
    };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.post('/api/sync/kv-to-cloud', async () => {
  try {
    const allKeys = await puter.kv.list();
    const grudgeKeys = allKeys.filter(k => k.startsWith(KV_PREFIX));
    let synced = 0;
    const errors: string[] = [];

    for (const key of grudgeKeys) {
      try {
        const value = await puter.kv.get(key);
        if (value !== null) {
          const filename = key.replace(KV_PREFIX, '');
          await puter.fs.write(
            `${CLOUD_BASE}/data/${filename}.json`,
            JSON.stringify(value, null, 2)
          );
          synced++;
        }
      } catch (error) {
        errors.push(`Failed ${key}: ${error}`);
      }
    }

    await puter.kv.set(`${KV_PREFIX}last_sync`, { timestamp: new Date().toISOString() });

    return { success: errors.length === 0, synced, errors };
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
