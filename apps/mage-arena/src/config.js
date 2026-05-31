/** R2 CDN base URL for all sprites */
export const CDN = 'https://assets.grudge-studio.com';
export const MANIFEST_URL = `${CDN}/manifests/sprite-manifest.json`;

/** Frame size — all craftpix top-down sheets are 64x64 per frame, 4 rows (directions) */
export const FRAME = { w: 64, h: 64 };
/** Direction row indices in the sprite sheets: front=0, left=1, back=2, right=3 */
export const DIR = { down: 0, left: 1, up: 2, right: 3 };

/** Hero definitions — the 4 playable characters (using T3/best tier) */
export const HEROES = {
  lich:      { name: 'Lich',      role: 'Mage',    tier: 3, color: 0x8844ff, attack: { frames: 8, rate: 10 }, death: { frames: 10 }, hurt: { frames: 4 }, idle: { frames: 4, rate: 6 }, run: { frames: 6 }, walk: { frames: 6 }, speed: 120, hp: 80,  mp: 120, projType: 'flame' },
  lizardman: { name: 'Lizardman', role: 'Warrior', tier: 3, color: 0x44aa22, attack: { frames: 7, rate: 12 }, death: { frames: 7 }, hurt: { frames: 5 }, idle: { frames: 4, rate: 6 }, run: { frames: 8 }, walk: { frames: 6 }, speed: 100, hp: 150, mp: 30,  projType: 'slash' },
  skeleton:  { name: 'Skeleton',  role: 'Rogue',   tier: 3, color: 0xcccccc, attack: { frames: 9, rate: 14 }, death: { frames: 6 }, hurt: { frames: 4 }, idle: { frames: 4, rate: 6 }, run: { frames: 8 }, walk: { frames: 6 }, speed: 160, hp: 70,  mp: 50,  projType: 'slash' },
  orc:       { name: 'Orc',       role: 'Tank',    tier: 3, color: 0x886633, attack: { frames: 8, rate: 10 }, death: { frames: 8 }, hurt: { frames: 6 }, idle: { frames: 4, rate: 6 }, run: { frames: 8 }, walk: { frames: 6 }, speed: 90,  hp: 200, mp: 20,  projType: 'slash' },
};

/** Animation names used throughout */
export const ANIMS = ['attack', 'death', 'hurt', 'idle', 'run', 'walk'];

/** Build the R2 URL for a hero sprite sheet */
export function heroSpriteUrl(charKey, anim, tier = 3) {
  return `${CDN}/sprites/characters/${charKey}/t${tier}/${anim}.png`;
}

/** Build a Phaser spritesheet key */
export function heroKey(charKey, anim) {
  return `${charKey}_${anim}`;
}

/** Skill definitions per class for the action bar */
export const SKILLS = {
  lich:      ['Fireball', 'Ice Blast', 'Teleport', 'Meteor'],
  lizardman: ['Cleave', 'Shield Bash', 'War Cry', 'Whirlwind'],
  skeleton:  ['Backstab', 'Dash', 'Poison', 'Shadow Step'],
  orc:       ['Smash', 'Ground Slam', 'Taunt', 'Rage'],
};

/** World size */
export const WORLD = { w: 2400, h: 2400 };
