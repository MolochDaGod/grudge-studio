/** R2 CDN base URL for all sprites */
export const CDN = 'https://pub-e7fcf1fd4c9946ecb84b3766bbc7b50d.r2.dev';

/** Frame sizes per asset type */
export const FRAME = { w: 48, h: 48 };         // Foozle heroes
export const FRAME_GOLEM = { w: 64, h: 64 };   // Golem (4-row combined)
export const FRAME_BOSS = { w: 480, h: 480 };   // Mythology bosses

/** Direction identifiers — maps to R2 folder names */
export const DIR = { down: 'down', up: 'up', left: 'left', right: 'right' };
/** Direction index (for golem 4-row sheets) */
export const DIR_IDX = { down: 0, left: 1, up: 2, right: 3 };

/** Hero definitions — 4 playable Foozle Lucifer characters */
export const HEROES = {
  sorceress: {
    name: 'Sorceress', role: 'Mage', color: 0xaa44ff,
    speed: 130, hp: 90, mp: 140, resource: 'Mana',
    attackType: 'projectile', projSpeed: 350, projRange: 400,
    anims: {
      attack01: { frames: 6, rate: 12 },
      attack02: { frames: 6, rate: 12 },
      attack03: { frames: 6, rate: 12 },
      death:    { frames: 8, rate: 8 },
      hurt:     { frames: 3, rate: 10 },
      idle:     { frames: 6, rate: 6 },
      run:      { frames: 6, rate: 10 },
      walk:     { frames: 6, rate: 8 },
    },
    icon: 'icon_sorceress',
  },
  skeletonhunter: {
    name: 'Skeleton Hunter', role: 'Ranger', color: 0x88ccaa,
    speed: 140, hp: 75, mp: 100, resource: 'Focus',
    attackType: 'projectile', projSpeed: 450, projRange: 500,
    anims: {
      attack01: { frames: 8, rate: 12 },
      death:    { frames: 6, rate: 8 },
      hurt:     { frames: 3, rate: 10 },
      idle:     { frames: 6, rate: 6 },
      walk:     { frames: 6, rate: 8 },
    },
    icon: 'icon_warrior',
  },
  warrior: {
    name: 'Warrior', role: 'Warrior', color: 0xcc6622,
    speed: 110, hp: 160, mp: 60, resource: 'Stamina',
    attackType: 'melee', meleeRange: 60, meleeArc: 90,
    anims: {
      attack01: { frames: 6, rate: 14 },
      attack02: { frames: 6, rate: 14 },
      attack03: { frames: 6, rate: 14 },
      death:    { frames: 8, rate: 8 },
      hurt:     { frames: 3, rate: 10 },
      idle:     { frames: 6, rate: 6 },
      run:      { frames: 6, rate: 10 },
      walk:     { frames: 6, rate: 8 },
    },
    icon: 'icon_warrior',
  },
  golem: {
    name: 'Golem', role: 'Tank', color: 0x557766,
    speed: 80, hp: 250, mp: 40, resource: 'Stamina',
    attackType: 'aoe', aoeRadius: 80,
    isGolem: true,
    anims: {
      attack: { frames: 8, rate: 10 },
      death:  { frames: 10, rate: 8 },
      hurt:   { frames: 4, rate: 10 },
      idle:   { frames: 4, rate: 6 },
      run:    { frames: 8, rate: 10 },
      walk:   { frames: 6, rate: 8 },
    },
    icon: 'icon_necromancer',
  },
};

/** Boss definitions — Mythology 480×480 bosses */
export const BOSSES = {
  anubis: {
    name: 'Anubis', hp: 2000, damage: 35, speed: 60, color: 0xddaa00,
    anims: {
      attacking: { frames: 10, rate: 10 },
      dying:     { frames: 10, rate: 8 },
      hurt:      { frames: 10, rate: 10 },
      idle:      { frames: 16, rate: 6 },
      running:   { frames: 12, rate: 10 },
      walking:   { frames: 20, rate: 8 },
    },
  },
  medusa: {
    name: 'Medusa', hp: 1800, damage: 40, speed: 55, color: 0x44cc44,
    anims: {
      attacking: { frames: 10, rate: 10 },
      dying:     { frames: 10, rate: 8 },
      hurt:      { frames: 10, rate: 10 },
      idle:      { frames: 16, rate: 6 },
      running:   { frames: 12, rate: 10 },
      walking:   { frames: 20, rate: 8 },
    },
  },
  horus: {
    name: 'Horus', hp: 2200, damage: 30, speed: 65, color: 0x4488ff,
    anims: {
      attacking: { frames: 10, rate: 10 },
      dying:     { frames: 10, rate: 8 },
      hurt:      { frames: 10, rate: 10 },
      idle:      { frames: 16, rate: 6 },
      running:   { frames: 12, rate: 10 },
      walking:   { frames: 20, rate: 8 },
    },
  },
};

/** Core animations used for Foozle heroes */
export const ANIMS = ['attack01', 'death', 'hurt', 'idle', 'walk'];
/** Golem animations (different naming) */
export const ANIMS_GOLEM = ['attack', 'death', 'hurt', 'idle', 'run', 'walk'];
/** Boss animation keys */
export const ANIMS_BOSS = ['attacking', 'dying', 'hurt', 'idle', 'running', 'walking'];
/** Boss directions */
export const BOSS_DIRS = ['front', 'back', 'left', 'right'];

/** Direction list */
export const DIRECTIONS = ['down', 'up', 'left', 'right'];

/** Build R2 URL for a Foozle hero spritesheet (one per direction per animation) */
export function heroSpriteUrl(charKey, dir, anim) {
  return `${CDN}/sprites/foozle/${charKey}/${dir}/${anim}.png`;
}

/** Build R2 URL for golem (4-row combined sheets) */
export function golemSpriteUrl(anim) {
  return `${CDN}/sprites/foozle/golem/${anim}.png`;
}

/** Build R2 URL for boss spritesheets */
export function bossSpriteUrl(bossKey, dir, anim) {
  return `${CDN}/sprites/foozle/bosses/${bossKey}/${dir}-${anim}.png`;
}

/** Phaser spritesheet key */
export function heroKey(charKey, anim, dir) {
  return `${charKey}_${anim}_${dir}`;
}

/** Boss spritesheet key */
export function bossKey(bossId, anim, dir) {
  return `boss_${bossId}_${anim}_${dir}`;
}

/** Skill definitions per class
 *  dual: true means skill behaves differently on ally vs enemy target
 *  allyEffect: status effect applied to selected ally
 *  enemyEffect: status effect applied to enemies
 */
export const SKILLS = {
  sorceress: [
    { name: 'Magic Missile', cost: 15, damage: 30, type: 'projectile' },
    { name: 'Arcane Surge',  cost: 25, damage: 45, type: 'projectile', dual: true, allyEffect: 'regen', enemyEffect: 'burning' },
    { name: 'Teleport',      cost: 30, damage: 0,  type: 'dash' },
    { name: 'Meteor',        cost: 50, damage: 80, type: 'aoe', enemyEffect: 'burning' },
  ],
  skeletonhunter: [
    { name: 'Power Shot',    cost: 15, damage: 35, type: 'projectile' },
    { name: "Nature's Arrow",cost: 25, damage: 25, type: 'aoe', dual: true, allyEffect: 'regen', allyHeal: 20, enemyEffect: 'poison' },
    { name: 'Evade',         cost: 20, damage: 0,  type: 'dash' },
    { name: 'Snipe',         cost: 40, damage: 70, type: 'projectile' },
  ],
  warrior: [
    { name: 'Cleave',       cost: 10, damage: 40, type: 'melee' },
    { name: 'Battle Shout', cost: 20, damage: 25, type: 'melee', dual: true, allyEffect: 'haste', enemyEffect: 'stunned' },
    { name: 'War Cry',      cost: 25, damage: 0,  type: 'buff' },
    { name: 'Whirlwind',    cost: 35, damage: 55, type: 'aoe', enemyEffect: 'bleed' },
  ],
  golem: [
    { name: 'Ground Slam',  cost: 10, damage: 50, type: 'aoe' },
    { name: 'Earth Shield',  cost: 20, damage: 35, type: 'projectile', dual: true, allyEffect: 'shield', enemyEffect: 'frozen' },
    { name: 'Taunt',         cost: 15, damage: 0,  type: 'buff' },
    { name: 'Earthquake',    cost: 40, damage: 70, type: 'aoe', enemyEffect: 'stunned' },
  ],
};

/** Equipment slot definitions */
export const EQUIPMENT_SLOTS = ['Head', 'Chest', 'Bottom', 'Feet', 'Weapons', 'Misc'];

/** Pickup types */
export const PICKUP_KEYS = ['health_small', 'mana_small', 'gem_blue', 'gem_orange', 'gold_coins'];

/** UI asset keys for loading */
export const UI_KEYS = {
  hotbar:         'HUD/Hotbar/Hotbar.png',
  mainBars:       'HUD/Hotbar/MainBars/Png/MainBars1.png',
  inventory:      'HUD/Inventory/Png/Inventory.png',
  minimapFrame:   'HUD/Minimap/Png/MinimapFrame.png',
  bossHealthBar:  'Boss_Health_Bar/BossHealthBar.png',
  hudHealthBar:   'HUD_Health_Bar/HUDHealthBar.png',
  panel1:         'Panels/Panels/SimplePanel01.png',
  buttonBg:       'Button_Background/ButtonBackground.png',
};

/** Resolve a UI asset key to its full CDN URL */
export function uiUrl(key) {
  return `${CDN}/sprites/foozle/ui/${UI_KEYS[key]}`;
}

/** World / dungeon config */
export const WORLD = { w: 3200, h: 3200 };
export const TILE_SIZE = 16;

/** Consumable item definitions for slots 5-6-7 */
export const CONSUMABLES = [
  { name: 'HP Pot',  slot: 5 },
  { name: 'MP Pot',  slot: 6 },
  { name: 'Elixir',  slot: 7 },
];

/** Combat constants */
export const COMBAT = {
  baseLMBDamage: 20,
  resourcePerHit: 8,
  parryWindow: 300,
  parryReduction: 0.7,
  dashDistance: 120,
  dashDuration: 200,
  dashCooldown: 1500,
  bossSpawnKills: 15,
  critChance: 0.20,
  critMult: 1.5,
  enemyAttackRange: 280,
  enemyMeleeRange: 50,
  enemyAttackCdMin: 1800,
  enemyAttackCdMax: 3000,
  allyAttackCd: 1200,
  allyFollowDist: 120,
  allyAttackRange: 250,
};

/** Get the correct attack animation key for a hero (golem uses 'attack', others use 'attack01') */
export function getAttackAnimKey(charKey) {
  return HEROES[charKey]?.isGolem ? 'attack' : 'attack01';
}
