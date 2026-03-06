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
    incr: (key: string, amount?: number) => Promise<number>;
    decr: (key: string, amount?: number) => Promise<number>;
  };
};

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  timestamp: string;
}

export interface SyncStatus {
  lastSync: string | null;
  itemCount: number;
  cloudPath: string;
  kvKeys: string[];
}

export class CloudSyncService {
  private cloudBasePath: string;
  private kvPrefix: string;

  constructor(cloudBasePath = '/grudge-warlords', kvPrefix = 'grudge_') {
    this.cloudBasePath = cloudBasePath;
    this.kvPrefix = kvPrefix;
  }

  async initializeCloudStructure(): Promise<void> {
    const directories = [
      `${this.cloudBasePath}/data`,
      `${this.cloudBasePath}/data/recipes`,
      `${this.cloudBasePath}/data/materials`,
      `${this.cloudBasePath}/data/weapons`,
      `${this.cloudBasePath}/data/armor`,
      `${this.cloudBasePath}/data/items`,
      `${this.cloudBasePath}/data/reports`,
      `${this.cloudBasePath}/assets`,
      `${this.cloudBasePath}/assets/weapons`,
      `${this.cloudBasePath}/assets/armor`,
      `${this.cloudBasePath}/assets/characters`,
      `${this.cloudBasePath}/assets/items`,
      `${this.cloudBasePath}/assets/effects`,
      `${this.cloudBasePath}/assets/environments`,
      `${this.cloudBasePath}/assets/ui`,
      `${this.cloudBasePath}/assets/misc`,
      `${this.cloudBasePath}/assets/imports`,
      `${this.cloudBasePath}/backups`,
      `${this.cloudBasePath}/exports`
    ];

    for (const dir of directories) {
      try {
        await puter.fs.mkdir(dir);
      } catch {
      }
    }
  }

  async syncKVToCloud(keys?: string[]): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;

    try {
      const allKeys = keys || await puter.kv.list();
      const grudgeKeys = allKeys.filter(k => k.startsWith(this.kvPrefix));

      for (const key of grudgeKeys) {
        try {
          const value = await puter.kv.get(key);
          if (value !== null && value !== undefined) {
            const filename = key.replace(this.kvPrefix, '');
            const path = `${this.cloudBasePath}/data/${filename}.json`;
            await puter.fs.write(path, JSON.stringify(value, null, 2));
            synced++;
          }
        } catch (error) {
          errors.push(`Failed to sync ${key}: ${error}`);
          failed++;
        }
      }
    } catch (error) {
      errors.push(`Sync failed: ${error}`);
    }

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  async syncCloudToKV(dataType?: string): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;

    try {
      const searchPath = dataType 
        ? `${this.cloudBasePath}/data/${dataType}`
        : `${this.cloudBasePath}/data`;

      const files = await puter.fs.readdir(searchPath);
      const jsonFiles = files.filter(f => !f.is_dir && f.name.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const blob = await puter.fs.read(`${searchPath}/${file.name}`);
          const text = await blob.text();
          const data = JSON.parse(text);
          
          const keyName = file.name.replace('.json', '');
          await puter.kv.set(`${this.kvPrefix}${keyName}`, data);
          synced++;
        } catch (error) {
          errors.push(`Failed to sync ${file.name}: ${error}`);
          failed++;
        }
      }
    } catch (error) {
      errors.push(`Cloud sync failed: ${error}`);
    }

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  async createBackup(name?: string): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = name || `backup-${timestamp}`;
      const backupPath = `${this.cloudBasePath}/backups/${backupName}`;

      await puter.fs.mkdir(backupPath);

      const allKeys = await puter.kv.list();
      const grudgeKeys = allKeys.filter(k => k.startsWith(this.kvPrefix));

      const backupData: Record<string, unknown> = {};
      for (const key of grudgeKeys) {
        backupData[key] = await puter.kv.get(key);
      }

      await puter.fs.write(
        `${backupPath}/data.json`,
        JSON.stringify(backupData, null, 2)
      );

      const manifest = {
        name: backupName,
        createdAt: new Date().toISOString(),
        keyCount: grudgeKeys.length,
        keys: grudgeKeys
      };
      await puter.fs.write(
        `${backupPath}/manifest.json`,
        JSON.stringify(manifest, null, 2)
      );

      return { success: true, path: backupPath };
    } catch (error) {
      return { success: false, path: '', error: String(error) };
    }
  }

  async restoreBackup(backupPath: string): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;

    try {
      const dataBlob = await puter.fs.read(`${backupPath}/data.json`);
      const dataText = await dataBlob.text();
      const backupData = JSON.parse(dataText);

      for (const [key, value] of Object.entries(backupData)) {
        try {
          await puter.kv.set(key, value);
          synced++;
        } catch (error) {
          errors.push(`Failed to restore ${key}: ${error}`);
          failed++;
        }
      }
    } catch (error) {
      errors.push(`Restore failed: ${error}`);
    }

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  async listBackups(): Promise<{ name: string; createdAt: string; keyCount: number }[]> {
    try {
      const backups: { name: string; createdAt: string; keyCount: number }[] = [];
      const items = await puter.fs.readdir(`${this.cloudBasePath}/backups`);

      for (const item of items.filter(i => i.is_dir)) {
        try {
          const manifestBlob = await puter.fs.read(`${this.cloudBasePath}/backups/${item.name}/manifest.json`);
          const manifestText = await manifestBlob.text();
          const manifest = JSON.parse(manifestText);
          backups.push({
            name: manifest.name,
            createdAt: manifest.createdAt,
            keyCount: manifest.keyCount
          });
        } catch {
        }
      }

      return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }

  async exportData(format: 'json' | 'csv' = 'json'): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportPath = `${this.cloudBasePath}/exports/export-${timestamp}`;
      
      await puter.fs.mkdir(exportPath);

      const dataTypes = ['recipes', 'materials', 'weapons', 'armor', 'items', 'characters'];
      
      for (const dataType of dataTypes) {
        const data = await puter.kv.get(`${this.kvPrefix}${dataType}`);
        if (data) {
          if (format === 'json') {
            await puter.fs.write(
              `${exportPath}/${dataType}.json`,
              JSON.stringify(data, null, 2)
            );
          } else if (format === 'csv' && Array.isArray(data)) {
            const csv = this.convertToCSV(data);
            await puter.fs.write(`${exportPath}/${dataType}.csv`, csv);
          }
        }
      }

      return { success: true, path: exportPath };
    } catch (error) {
      return { success: false, path: '', error: String(error) };
    }
  }

  private convertToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).includes(',') ? `"${value}"` : String(value);
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  async getStatus(): Promise<SyncStatus> {
    try {
      const allKeys = await puter.kv.list();
      const grudgeKeys = allKeys.filter(k => k.startsWith(this.kvPrefix));

      let lastSync: string | null = null;
      try {
        const syncInfo = await puter.kv.get(`${this.kvPrefix}last_sync`);
        if (syncInfo && typeof syncInfo === 'object' && 'timestamp' in syncInfo) {
          lastSync = (syncInfo as { timestamp: string }).timestamp;
        }
      } catch {
      }

      return {
        lastSync,
        itemCount: grudgeKeys.length,
        cloudPath: this.cloudBasePath,
        kvKeys: grudgeKeys
      };
    } catch {
      return {
        lastSync: null,
        itemCount: 0,
        cloudPath: this.cloudBasePath,
        kvKeys: []
      };
    }
  }

  async recordSync(): Promise<void> {
    await puter.kv.set(`${this.kvPrefix}last_sync`, {
      timestamp: new Date().toISOString(),
      source: 'CloudSyncService'
    });
  }
}

// Usage: const cloudSync = new CloudSyncService(); (only in Puter browser context)
