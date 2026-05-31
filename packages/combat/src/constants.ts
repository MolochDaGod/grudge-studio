// ============================================
// COLLISION GROUP BITMASKS
// Powers of 2, starting from 2 to avoid conflict with default value 1.
// Ported from annihilatetrainer/src/global.js
// ============================================

/** Static world geometry (ground, walls, platforms) */
export const GROUP_SCENE = 2;
/** Player-controlled characters */
export const GROUP_ROLE = 4;
/** Enemy characters */
export const GROUP_ENEMY = 8;
/** Player attack hitboxes (swords, fists, etc.) */
export const GROUP_ROLE_ATTACKER = 16;
/** Enemy attack hitboxes */
export const GROUP_ENEMY_ATTACKER = 32;
/** AI detection trigger volumes */
export const GROUP_TRIGGER = 64;
/** Enemy shield/block colliders */
export const GROUP_ENEMY_SHIELD = 128;
/** Bodies that should not collide with anything */
export const GROUP_NO_COLLIDE = 256;

// ============================================
// TIMING
// ============================================

/** Maximum delta time to prevent physics explosions (60 FPS target) */
export const MAX_DT = 1 / 60;

// ============================================
// AI DEFAULTS
// ============================================

/** Default AI detection radius (units) */
export const DEFAULT_DETECTOR_RADIUS = 8;
/** Squared tolerance for AI return-to-origin check */
export const INITIAL_POSITION_TOLERANCE_SQ = 1;

// ============================================
// COMBAT DEFAULTS
// ============================================

/** Default bullet speed (units per frame at 60 FPS) */
export const BULLET_SPEED = 0.18;
/** Default bullet lifetime (ms) */
export const BULLET_LIFETIME_MS = 2000;
/** Default hadouken radius */
export const HADOUKEN_RADIUS = 0.8;
/** Default AoE pop radius */
export const POP_RADIUS = 3.7;

// ============================================
// WEAPON COLLISION PRESETS
// Role attacker → hits enemies + enemy attackers + enemy shields
// Enemy attacker → hits roles + role attackers
// ============================================

export const ROLE_ATTACKER_MASK = GROUP_ENEMY | GROUP_ENEMY_ATTACKER | GROUP_ENEMY_SHIELD;
export const ENEMY_ATTACKER_MASK = GROUP_ROLE | GROUP_ROLE_ATTACKER;

// ============================================
// AI COOLDOWN DEFAULTS (ms)
// ============================================

export const AI_COOLDOWNS = {
  mutant: 4000,
  paladin: 6000,
  robot: 4000,
  robotBoss: 7000,
  parrot: 3000,
} as const;
