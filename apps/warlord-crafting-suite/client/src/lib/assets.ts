export const ASSET_BASE_PATH = "/2dassets";
export const SPRITE_BASE_PATH = "/2dassets/sprites";

export const ASSET_CATEGORIES = {
  weapons: {
    melee: `${ASSET_BASE_PATH}/weapons/melee`,
    ranged: `${ASSET_BASE_PATH}/weapons/ranged`,
    magic: `${ASSET_BASE_PATH}/weapons/magic`,
  },
  armor: {
    cloth: `${ASSET_BASE_PATH}/armor/cloth`,
    leather: `${ASSET_BASE_PATH}/armor/leather`,
    metal: `${ASSET_BASE_PATH}/armor/metal`,
    gem: `${ASSET_BASE_PATH}/armor/gem`,
  },
  professions: `${ASSET_BASE_PATH}/professions`,
  materials: `${ASSET_BASE_PATH}/materials`,
  ui: `${ASSET_BASE_PATH}/ui`,
  sprites: {
    ore: `${SPRITE_BASE_PATH}/ore`,
    wood: `${SPRITE_BASE_PATH}/wood`,
    plank: `${SPRITE_BASE_PATH}/plank`,
    component: `${SPRITE_BASE_PATH}/component`,
    essence: `${SPRITE_BASE_PATH}/essence`,
    gem: `${SPRITE_BASE_PATH}/gem`,
    leather: `${SPRITE_BASE_PATH}/leather`,
    cloth: `${SPRITE_BASE_PATH}/cloth`,
    thread: `${SPRITE_BASE_PATH}/thread`,
    gear: `${SPRITE_BASE_PATH}/gear`,
    ingredient: `${SPRITE_BASE_PATH}/ingredient`,
    sword: `${SPRITE_BASE_PATH}/sword`,
    axe: `${SPRITE_BASE_PATH}/axe`,
    bow: `${SPRITE_BASE_PATH}/bow`,
    crossbow: `${SPRITE_BASE_PATH}/crossbow`,
    gun: `${SPRITE_BASE_PATH}/gun`,
    staff: `${SPRITE_BASE_PATH}/staff`,
    dagger: `${SPRITE_BASE_PATH}/dagger`,
    hammer: `${SPRITE_BASE_PATH}/hammer`,
    greatsword: `${SPRITE_BASE_PATH}/greatsword`,
    greataxe: `${SPRITE_BASE_PATH}/greataxe`,
    tome: `${SPRITE_BASE_PATH}/tome`,
  },
} as const;

export type SpriteCategory = keyof typeof ASSET_CATEGORIES.sprites;

export function getWeaponAssetPath(weaponId: string, category: "melee" | "ranged" | "magic"): string {
  return `${ASSET_CATEGORIES.weapons[category]}/${weaponId}.png`;
}

export function getArmorAssetPath(armorId: string, material: "cloth" | "leather" | "metal" | "gem"): string {
  return `${ASSET_CATEGORIES.armor[material]}/${armorId}.png`;
}

export function getProfessionAssetPath(profession: string): string {
  return `${ASSET_CATEGORIES.professions}/${profession.toLowerCase()}.png`;
}

export function getMaterialAssetPath(materialId: string): string {
  return `${ASSET_CATEGORIES.materials}/${materialId}.png`;
}

export function getUIAssetPath(assetName: string): string {
  return `${ASSET_CATEGORIES.ui}/${assetName}.png`;
}

export function getSpriteAssetPath(itemId: string, category: SpriteCategory): string {
  return `${ASSET_CATEGORIES.sprites[category]}/${itemId}.png`;
}

export function getSpritePath(itemId: string, category: string): string {
  const validCategory = category as SpriteCategory;
  if (ASSET_CATEGORIES.sprites[validCategory]) {
    return `${ASSET_CATEGORIES.sprites[validCategory]}/${itemId}.png`;
  }
  return `${SPRITE_BASE_PATH}/${category}/${itemId}.png`;
}

export function generateAssetSlug(category: string, subtype: string | null, itemId: string): string {
  if (subtype) {
    return `${category}-${subtype}-${itemId}`.toLowerCase().replace(/\s+/g, "-");
  }
  return `${category}-${itemId}`.toLowerCase().replace(/\s+/g, "-");
}

export const SPRITE_MANIFEST = {
  ore: ["copper-ore", "iron-ore", "steel-ore", "mithril-ore", "adamantine-ore", "orichalcum-ore", "starmetal-ore", "divine-ore"],
  wood: ["pine-log", "oak-log", "maple-log", "ash-log", "ironwood-log", "ebony-log", "wyrmwood-log", "worldtree-log"],
  plank: ["pine-plank", "oak-plank", "maple-plank", "ash-plank", "ironwood-plank", "ebony-plank", "wyrmwood-plank", "worldtree-plank"],
  component: ["copper-ingot", "iron-ingot", "steel-ingot", "mithril-ingot", "adamantine-ingot", "orichalcum-ingot", "starmetal-ingot", "divine-ingot", "coal", "flux", "string", "bowstring", "gunpowder", "circuit", "lens", "spring"],
  essence: ["minor-essence", "lesser-essence", "greater-essence", "superior-essence", "refined-essence", "perfect-essence", "ancient-essence", "divine-essence"],
  gem: ["rough-gem", "flawed-gem", "standard-gem", "fine-gem", "pristine-gem", "flawless-gem", "radiant-gem", "divine-gem"],
  leather: ["rawhide", "thick-hide", "rugged-leather", "hardened-leather"],
  cloth: ["linen-cloth", "cotton-cloth", "wool-cloth", "silk-cloth", "enchanted-cloth", "arcane-cloth", "celestial-cloth", "divine-cloth"],
  thread: ["linen-thread", "cotton-thread", "wool-thread", "silk-thread", "enchanted-thread", "arcane-thread", "celestial-thread", "divine-thread"],
  gear: ["bronze-gear", "iron-gear", "steel-gear", "mithril-gear", "adamantine-gear", "orichalcum-gear", "starmetal-gear", "divine-gear"],
  ingredient: ["salt", "spice", "herb", "mushroom", "raw-meat", "raw-fish"],
  sword: ["bloodfeud-blade", "wraithfang", "oathbreaker", "kinrend", "dusksinger", "emberclad", "soulreaver", "grimshard"],
  axe: ["bloodfeud-cleaver", "wraithfang-cleaver", "oathbreaker-cleaver", "kinrend-cleaver", "dusksinger-cleaver", "emberclad-cleaver", "soulreaver-cleaver", "grimshard-cleaver"],
  bow: ["bloodfeud-bow", "wraithfang-bow", "oathbreaker-bow", "kinrend-bow", "shadowflight", "emberthorn"],
  crossbow: ["ironveil", "skullpiercer", "bloodreaver", "wraithspike", "emberbolt", "ironshard"],
  gun: ["blackpowder", "ironstorm", "bloodcannon", "wraithbarrel", "emberrifle", "duskblaster"],
  staff: ["bloodfeud-staff", "wraithfang-staff", "oathbreaker-staff", "kinrend-staff", "emberwrath", "infernal-grudge", "flameblood-spire", "hellfire-oathbreaker", "glacial-spire", "frostgrudge", "iceblood-spire", "frigid-oathbreaker"],
  dagger: ["nightfang", "shadowpiercer", "venombite", "whisperwind", "bloodshiv", "emberfang"],
  hammer: ["bloodfeud-hammer", "wraithfang-mace", "oathbreaker-maul", "kinrend-crusher", "ironfist", "embermallet", "titanmaul", "bloodcrusher", "wraithmaul", "emberforge", "ironbreaker", "duskmallet"],
  greatsword: ["doomspire", "bloodspire", "wraithblade", "emberbrand", "ironwrath", "duskreaver"],
  greataxe: ["skullsunder", "bloodreaver", "wraithhew", "embermaul", "ironrend", "dusksplitter"],
  tome: ["fire-tome", "frost-tome", "nature-tome", "holy-tome", "arcane-tome", "lightning-tome"],
} as const;

const WEAPON_CATEGORY_MAP: Record<string, SpriteCategory> = {
  swords: 'sword',
  axes1h: 'axe',
  daggers: 'dagger',
  greatswords: 'greatsword',
  greataxes: 'greataxe',
  hammers1h: 'hammer',
  hammers2h: 'hammer',
  bows: 'bow',
  crossbows: 'crossbow',
  guns: 'gun',
  fireStaves: 'staff',
  frostStaves: 'staff',
  holyStaves: 'staff',
  lightningStaves: 'staff',
  arcaneStaves: 'staff',
  natureStaves: 'staff',
};

export function getRecipeSpritePath(recipeId: string, subCategory: string): string | null {
  const itemId = recipeId.replace('recipe-', '');
  const spriteCategory = WEAPON_CATEGORY_MAP[subCategory];
  
  if (spriteCategory) {
    const manifest = SPRITE_MANIFEST[spriteCategory];
    if (manifest && (manifest as readonly string[]).includes(itemId)) {
      return `${ASSET_CATEGORIES.sprites[spriteCategory]}/${itemId}.png`;
    }
  }
  
  for (const [category, items] of Object.entries(SPRITE_MANIFEST)) {
    if ((items as readonly string[]).includes(itemId)) {
      return `${SPRITE_BASE_PATH}/${category}/${itemId}.png`;
    }
  }
  
  return null;
}

export function getMaterialSpritePath(materialName: string): string | null {
  const materialId = materialName.toLowerCase().replace(/\s+/g, '-');
  
  for (const [category, items] of Object.entries(SPRITE_MANIFEST)) {
    if ((items as readonly string[]).includes(materialId)) {
      return `${SPRITE_BASE_PATH}/${category}/${materialId}.png`;
    }
  }
  
  return null;
}
