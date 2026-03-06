// Grudge Warlords Custom UUID System
// Format: SLOT-TIER-ITEMID-TIMESTAMP-COUNTER

// Slot codes mapping (4 characters)
export const SLOT_CODES: Record<string, string> = {
  // Equipment slots
  'Helm': 'helm',
  'Head': 'head',
  'Shoulder': 'shou',
  'Chest': 'ches',
  'Hands': 'hand',
  'Gloves': 'glov',
  'Legs': 'legs',
  'Feet': 'feet',
  'Ring': 'ring',
  'Necklace': 'neck',
  'Relic': 'reli',
  'Offhand': 'offh',
  'Shield': 'shld',
  'MainHand': 'main',
  'TwoHand': 'twoh',
  'Weapon': 'weap',
  'Sword': 'swrd',
  'Axe': 'axee',
  'Mace': 'mace',
  'Dagger': 'dagr',
  'Staff': 'staf',
  'Wand': 'wand',
  'Bow': 'boww',
  'Crossbow': 'xbow',
  'Polearm': 'pole',
  'Hammer': 'hamr',
  'Spear': 'sper',
  // Resources
  'Ore': 'orex',
  'Mined': 'mine',
  'Wood': 'wood',
  'Log': 'logs',
  'Herb': 'herb',
  'Fiber': 'fibr',
  'Hide': 'hide',
  'Leather': 'lthr',
  'Cloth': 'clth',
  'Metal': 'metl',
  'Gem': 'gemx',
  'Stone': 'ston',
  'Crystal': 'crys',
  'Essence': 'essn',
  // Consumables & Misc
  'Potion': 'potn',
  'Food': 'food',
  'Scroll': 'scrl',
  'Elixir': 'elix',
  'Material': 'matl',
  'Component': 'comp',
  'Ingredient': 'ingr',
  'Item': 'item',
  'Quest': 'qust',
  'Key': 'keyy',
  'Token': 'tokn',
  'Currency': 'curr',
  'Loot': 'loot',
  'Treasure': 'trea',
  'Artifact': 'artf',
  // Sprites and UI
  'Sprite': 'sprt',
  'Icon': 'icon',
  'Ability': 'abil',
  'Skill': 'skil',
  'UI': 'uiel',
};

// Reverse lookup for slot codes
export const SLOT_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(SLOT_CODES).map(([name, code]) => [code, name])
);

// Tier codes
export const TIER_CODES: Record<number | 'none', string> = {
  0: 't0',
  1: 't1',
  2: 't2',
  3: 't3',
  4: 't4',
  5: 't5',
  6: 't6',
  7: 't7',
  8: 't8',
  'none': 'oo',
};

// Reverse lookup for tier codes
export const TIER_NUMBERS: Record<string, number | null> = {
  't0': 0,
  't1': 1,
  't2': 2,
  't3': 3,
  't4': 4,
  't5': 5,
  't6': 6,
  't7': 7,
  't8': 8,
  'oo': null,
};

// Counter for unique IDs within the same timestamp
let currentCounter = 0;
let lastTimestamp = '';

// Generate timestamp in Texas time format: HHMMMMDDYYYY
function generateTimestamp(): string {
  const now = new Date();
  const texasTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  
  const hours = texasTime.getHours().toString().padStart(2, '0');
  const minutes = texasTime.getMinutes().toString().padStart(2, '0');
  const month = (texasTime.getMonth() + 1).toString().padStart(2, '0');
  const day = texasTime.getDate().toString().padStart(2, '0');
  const year = texasTime.getFullYear().toString();
  
  return `${hours}${minutes}${month}${day}${year}`;
}

// Convert number to base-36 counter string
function toBase36Counter(num: number, length: number = 6): string {
  return num.toString(36).padStart(length, '0');
}

// Parse base-36 counter string to number
function fromBase36Counter(counter: string): number {
  return parseInt(counter, 36);
}

// Get next counter value
function getNextCounter(): string {
  const timestamp = generateTimestamp();
  
  if (timestamp !== lastTimestamp) {
    currentCounter = 0;
    lastTimestamp = timestamp;
  }
  
  const counter = toBase36Counter(currentCounter);
  currentCounter++;
  
  return counter;
}

export interface GrudgeUUIDComponents {
  slot: string;
  tier: string;
  itemId: string;
  timestamp: string;
  counter: string;
}

// Generate a Grudge UUID
export function generateGrudgeUUID(
  slotOrType: string,
  tier: number | 'none' = 'none',
  itemId: number = 1
): string {
  const slotCode = SLOT_CODES[slotOrType] || slotOrType.toLowerCase().substring(0, 4);
  const tierCode = typeof tier === 'number' ? TIER_CODES[tier] : TIER_CODES['none'];
  const itemIdStr = itemId.toString().padStart(4, '0');
  const timestamp = generateTimestamp();
  const counter = getNextCounter();
  
  return `${slotCode}-${tierCode}-${itemIdStr}-${timestamp}-${counter}`;
}

// Parse a Grudge UUID into components
export function parseGrudgeUUID(uuid: string): GrudgeUUIDComponents | null {
  const parts = uuid.split('-');
  
  if (parts.length !== 5) {
    return null;
  }
  
  return {
    slot: parts[0],
    tier: parts[1],
    itemId: parts[2],
    timestamp: parts[3],
    counter: parts[4],
  };
}

// Format timestamp for display
function formatTimestamp(timestamp: string): string {
  if (timestamp.length !== 12) return timestamp;
  
  const hours = timestamp.substring(0, 2);
  const minutes = timestamp.substring(2, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const year = timestamp.substring(8, 12);
  
  return `${month}/${day}/${year} ${hours}:${minutes} CST`;
}

// Get human-readable description of a Grudge UUID
export function describeGrudgeUUID(uuid: string): string {
  const components = parseGrudgeUUID(uuid);
  
  if (!components) {
    return 'Invalid Grudge UUID';
  }
  
  const slotName = SLOT_NAMES[components.slot] || components.slot.toUpperCase();
  const tierNum = TIER_NUMBERS[components.tier];
  const tierStr = tierNum !== null ? `Tier ${tierNum}` : 'No Tier';
  const itemNum = parseInt(components.itemId, 10);
  const dateStr = formatTimestamp(components.timestamp);
  
  return `${slotName} ${tierStr} (Item #${itemNum}) - Created ${dateStr} [${components.counter}]`;
}

// Validate a Grudge UUID format
export function isValidGrudgeUUID(uuid: string): boolean {
  const components = parseGrudgeUUID(uuid);
  
  if (!components) return false;
  
  // Validate slot code (4 chars)
  if (components.slot.length !== 4) return false;
  
  // Validate tier code (2 chars)
  if (components.tier.length !== 2) return false;
  
  // Validate item ID (4 digits)
  if (!/^\d{4}$/.test(components.itemId)) return false;
  
  // Validate timestamp (12 digits)
  if (!/^\d{12}$/.test(components.timestamp)) return false;
  
  // Validate counter (6+ alphanumeric)
  if (!/^[0-9a-z]{6,}$/.test(components.counter)) return false;
  
  return true;
}

// Generate UUID for sprites
export function generateSpriteUUID(
  category: string,
  spriteId: number = 1
): string {
  return generateGrudgeUUID('Sprite', 'none', spriteId);
}

// Generate UUID for abilities
export function generateAbilityUUID(
  tier: number = 0,
  abilityId: number = 1
): string {
  return generateGrudgeUUID('Ability', tier, abilityId);
}

// Generate UUID for skills
export function generateSkillUUID(
  tier: number = 0,
  skillId: number = 1
): string {
  return generateGrudgeUUID('Skill', tier, skillId);
}

// Generate UUID for UI elements
export function generateUIElementUUID(
  elementId: number = 1
): string {
  return generateGrudgeUUID('UI', 'none', elementId);
}
