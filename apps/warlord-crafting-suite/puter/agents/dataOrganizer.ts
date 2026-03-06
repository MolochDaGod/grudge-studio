/**
 * GRUDGE Data Organizer Agent
 * 
 * Best Practices for Puter.js:
 * - In browser context: use global `puter` object
 * - In worker context: use `me.puter` for developer resources
 * - ALWAYS use JSON.stringify() when storing objects in KV
 * - ALWAYS use JSON.parse() when reading objects from KV
 * - Use consistent key prefixes: grudge_data_, grudge_recipes_, etc.
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

export interface RecipeAnalysis {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  balanceScore: number;
  tierAppropriate: boolean;
}

export interface DataValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class DataOrganizerAgent {
  private kvPrefix: string;
  private cloudBasePath: string;
  private p: typeof puter;

  constructor(kvPrefix = 'grudge_', cloudBasePath = '/grudge-warlords/data') {
    this.kvPrefix = kvPrefix;
    this.cloudBasePath = cloudBasePath;
    this.p = getPuter();
  }

  async validateRecipe(recipe: {
    name: string;
    tier: number;
    profession: string;
    materials: { name: string; quantity: number }[];
    output: { name: string; quantity: number };
    goldCost?: number;
  }): Promise<RecipeAnalysis> {
    try {
      const prompt = `Analyze this crafting recipe for a fantasy RPG:
Name: ${recipe.name}
Tier: T${recipe.tier} (1-8 scale)
Profession: ${recipe.profession}
Materials: ${JSON.stringify(recipe.materials)}
Output: ${JSON.stringify(recipe.output)}
Gold Cost: ${recipe.goldCost || 0}

Evaluate:
1. Material costs appropriate for tier (T1=basic, T8=legendary)
2. Gold cost balanced for tier
3. Material types match profession (Chef uses meats/fish, Miner uses ores)
4. Output value reasonable for inputs
5. Any missing or unusual requirements

Respond in JSON: { isValid: boolean, issues: string[], suggestions: string[], balanceScore: 1-10, tierAppropriate: boolean }`;

      const response = await this.p.ai.chat([
        { role: 'system', content: 'You are a game balance expert for GRUDGE Warlords crafting system.' },
        { role: 'user', content: prompt }
      ]);

      const content = typeof response === 'string' ? response : (response.message?.content || '{}');
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch {
        return {
          isValid: true,
          issues: [],
          suggestions: [content],
          balanceScore: 5,
          tierAppropriate: true
        };
      }
    } catch (error) {
      return {
        isValid: false,
        issues: [`Analysis failed: ${error}`],
        suggestions: [],
        balanceScore: 0,
        tierAppropriate: false
      };
    }
  }

  async organizeGameData(dataType: 'recipes' | 'materials' | 'weapons' | 'armor' | 'items'): Promise<{
    organized: number;
    categories: Record<string, number>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const categories: Record<string, number> = {};
    let organized = 0;

    try {
      const rawDataStr = await this.p.kv.get(`${this.kvPrefix}${dataType}_raw`);
      if (!rawDataStr) {
        return { organized: 0, categories: {}, errors: ['No raw data found'] };
      }
      
      const rawData = JSON.parse(rawDataStr);
      if (!Array.isArray(rawData)) {
        return { organized: 0, categories: {}, errors: ['Raw data is not an array'] };
      }

      const organizedData: Record<string, unknown[]> = {};

      for (const item of rawData) {
        try {
          const category = await this.categorizeItem(item, dataType);
          if (!organizedData[category]) {
            organizedData[category] = [];
            categories[category] = 0;
          }
          organizedData[category].push(item);
          categories[category]++;
          organized++;
        } catch (error) {
          errors.push(`Failed to categorize item: ${error}`);
        }
      }

      await this.p.kv.set(`${this.kvPrefix}${dataType}_organized`, JSON.stringify(organizedData));
      
      try {
        await this.p.fs.mkdir(`${this.cloudBasePath}/${dataType}`, { createMissingParents: true });
      } catch {}
      
      await this.p.fs.write(
        `${this.cloudBasePath}/${dataType}/organized.json`,
        JSON.stringify(organizedData, null, 2)
      );

    } catch (error) {
      errors.push(`Organization failed: ${error}`);
    }

    return { organized, categories, errors };
  }

  private async categorizeItem(item: Record<string, unknown>, dataType: string): Promise<string> {
    if (dataType === 'recipes') {
      return (item.profession as string) || 'misc';
    }
    if (dataType === 'materials') {
      const name = (item.name as string || '').toLowerCase();
      if (name.includes('ore') || name.includes('metal') || name.includes('ingot')) return 'metals';
      if (name.includes('wood') || name.includes('lumber') || name.includes('log')) return 'lumber';
      if (name.includes('meat') || name.includes('fish')) return 'food';
      if (name.includes('essence') || name.includes('crystal')) return 'magical';
      if (name.includes('leather') || name.includes('hide') || name.includes('fur')) return 'leather';
      return 'misc';
    }
    if (dataType === 'weapons') {
      return (item.type as string) || 'misc';
    }
    if (dataType === 'armor') {
      return (item.slot as string) || (item.type as string) || 'misc';
    }
    return 'misc';
  }

  async syncToCloud(dataType: string): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const dataStr = await this.p.kv.get(`${this.kvPrefix}${dataType}`);
      if (!dataStr) {
        return { success: false, path: '', error: 'No data found in KV store' };
      }

      const path = `${this.cloudBasePath}/${dataType}.json`;
      await this.p.fs.write(path, dataStr);
      
      return { success: true, path };
    } catch (error) {
      return { success: false, path: '', error: String(error) };
    }
  }

  async loadFromCloud(dataType: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const path = `${this.cloudBasePath}/${dataType}.json`;
      const blob = await this.p.fs.read(path);
      const text = await blob.text();
      const data = JSON.parse(text);
      
      await this.p.kv.set(`${this.kvPrefix}${dataType}`, JSON.stringify(data));
      
      const count = Array.isArray(data) ? data.length : Object.keys(data).length;
      return { success: true, count };
    } catch (error) {
      return { success: false, count: 0, error: String(error) };
    }
  }

  async validateAllData(): Promise<DataValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const dataTypes = ['recipes', 'materials', 'weapons', 'armor', 'items'];

    for (const dataType of dataTypes) {
      try {
        const dataStr = await this.p.kv.get(`${this.kvPrefix}${dataType}`);
        if (!dataStr) {
          warnings.push(`No ${dataType} data found`);
          continue;
        }

        const data = JSON.parse(dataStr);
        const items = Array.isArray(data) ? data : Object.values(data).flat();
        
        for (const item of items) {
          const issues = this.validateItem(item as Record<string, unknown>, dataType);
          errors.push(...issues.errors.map(e => `${dataType}: ${e}`));
          warnings.push(...issues.warnings.map(w => `${dataType}: ${w}`));
        }
      } catch (error) {
        errors.push(`Failed to validate ${dataType}: ${error}`);
      }
    }

    if (errors.length === 0 && warnings.length < 5) {
      suggestions.push('Data looks healthy! Consider adding more T7-T8 recipes for endgame content.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private validateItem(item: Record<string, unknown>, dataType: string): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!item.name && !item.id) {
      errors.push('Item missing name or id');
    }

    if (dataType === 'recipes') {
      if (!item.materials && !item.ingredients) {
        errors.push(`Recipe "${item.name}" has no materials`);
      }
      if (!item.tier && item.tier !== 0) {
        warnings.push(`Recipe "${item.name}" missing tier`);
      }
    }

    if (dataType === 'weapons' || dataType === 'armor') {
      if (!item.tier && item.tier !== 0) {
        warnings.push(`${dataType} "${item.name}" missing tier`);
      }
    }

    return { errors, warnings };
  }

  async generateReport(): Promise<string> {
    const validation = await this.validateAllData();
    
    const stats: Record<string, number> = {};
    const dataTypes = ['recipes', 'materials', 'weapons', 'armor', 'items'];
    
    for (const dataType of dataTypes) {
      try {
        const dataStr = await this.p.kv.get(`${this.kvPrefix}${dataType}`);
        if (dataStr) {
          const data = JSON.parse(dataStr);
          stats[dataType] = Array.isArray(data) ? data.length : Object.values(data).flat().length;
        }
      } catch {
        stats[dataType] = 0;
      }
    }

    const report = `
# GRUDGE Warlords Data Report
Generated: ${new Date().toISOString()}

## Statistics
${Object.entries(stats).map(([k, v]) => `- ${k}: ${v} items`).join('\n')}

## Validation Status
- Valid: ${validation.valid ? 'Yes' : 'No'}
- Errors: ${validation.errors.length}
- Warnings: ${validation.warnings.length}

${validation.errors.length > 0 ? `### Errors\n${validation.errors.map(e => `- ${e}`).join('\n')}` : ''}

${validation.warnings.length > 0 ? `### Warnings\n${validation.warnings.map(w => `- ${w}`).join('\n')}` : ''}

${validation.suggestions.length > 0 ? `### Suggestions\n${validation.suggestions.map(s => `- ${s}`).join('\n')}` : ''}
`;

    try {
      await this.p.fs.mkdir(`${this.cloudBasePath}/reports`, { createMissingParents: true });
    } catch {}
    
    await this.p.fs.write(`${this.cloudBasePath}/reports/latest.md`, report);
    
    await this.p.kv.set(`${this.kvPrefix}report_latest`, JSON.stringify({
      generatedAt: new Date().toISOString(),
      stats,
      validation
    }));
    
    return report;
  }
}

// Usage: const dataOrganizer = new DataOrganizerAgent(); (only in Puter browser context)
