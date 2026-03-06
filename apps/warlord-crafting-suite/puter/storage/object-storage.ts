/**
 * GRUDGE Warlords Object Storage Helper
 * 
 * Access game art assets stored in Replit Object Storage.
 * Set OBJECT_STORAGE_BUCKET environment variable to your bucket ID.
 */

const BUCKET_ID = process.env.OBJECT_STORAGE_BUCKET || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '';
const API_BASE = process.env.YOUR_APP_URL || '';

export class GrudgeStorage {
  private bucketId: string;
  private apiBase: string;

  constructor(bucketId?: string, apiBase?: string) {
    this.bucketId = bucketId || BUCKET_ID;
    this.apiBase = apiBase || API_BASE;
  }

  /**
   * Get the URL for a public asset via the /objects route
   * @param path - Asset path (e.g., 'public/weapons/sword-iron.png')
   */
  getAssetUrl(path: string): string {
    if (this.apiBase) {
      return `${this.apiBase}/objects/${path}`;
    }
    return `/objects/${path}`;
  }

  /**
   * Request a presigned upload URL
   * Use this to upload new assets to object storage
   */
  async requestUploadUrl(name: string, size?: number, contentType?: string): Promise<{ uploadURL: string; objectPath: string }> {
    const response = await fetch(`${this.apiBase}/api/uploads/request-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, size, contentType }),
    });
    return response.json();
  }

  /**
   * Asset categories available
   */
  static readonly CATEGORIES = {
    WEAPONS: 'weapons',
    ARMOR: 'armor',
    MATERIALS: 'materials',
    PROFESSIONS: 'professions',
    UI: 'ui',
  } as const;

  /**
   * Known asset paths for quick reference
   */
  static readonly ASSETS = {
    // Profession icons
    MINER_ICON: 'professions/miner.png',
    FORESTER_ICON: 'professions/forester.png',
    MYSTIC_ICON: 'professions/mystic.png',
    CHEF_ICON: 'professions/chef.png',
    ENGINEER_ICON: 'professions/engineer.png',

    // UI elements
    GOLD_ICON: 'ui/gold.png',
    XP_ICON: 'ui/xp.png',
    SKILL_POINT_ICON: 'ui/skill-point.png',

    // Tier badges
    TIER_1_BADGE: 'ui/tier-1.png',
    TIER_2_BADGE: 'ui/tier-2.png',
    TIER_3_BADGE: 'ui/tier-3.png',
    TIER_4_BADGE: 'ui/tier-4.png',
    TIER_5_BADGE: 'ui/tier-5.png',
    TIER_6_BADGE: 'ui/tier-6.png',
    TIER_7_BADGE: 'ui/tier-7.png',
    TIER_8_BADGE: 'ui/tier-8.png',
  } as const;
}

// Export singleton
export const storage = new GrudgeStorage();

/**
 * Direct access to Replit Object Storage (requires @replit/object-storage package)
 * 
 * Usage:
 * ```typescript
 * import { Client } from '@replit/object-storage';
 * 
 * const client = new Client();
 * 
 * // Upload
 * await client.uploadFromFile('weapons/new-sword.png', './local-file.png');
 * 
 * // Download
 * const { data } = await client.downloadAsBytes('weapons/sword.png');
 * 
 * // List
 * const objects = await client.list('weapons/');
 * ```
 */
export const STORAGE_DOCS = `
Replit Object Storage Integration
=================================

Install: npm install @replit/object-storage

Environment: Set DEFAULT_OBJECT_STORAGE_BUCKET_ID in secrets

Current Bucket: ${BUCKET_ID || '(not configured)'}

Asset Structure:
├── public/
│   ├── weapons/     - Weapon images
│   ├── armor/       - Armor images  
│   ├── materials/   - Material icons
│   ├── professions/ - Profession artwork
│   └── ui/          - UI elements
└── .private/
    └── uploads/     - User uploads

API Endpoints:
- GET /objects/:path - Retrieve stored objects
- POST /api/uploads/request-url - Get presigned upload URL
`;
