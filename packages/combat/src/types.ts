// ============================================
// FRAMEWORK-AGNOSTIC COMBAT INTERFACES
// These decouple the combat engine from Three.js / Cannon-ES / Phaser
// so the same logic can run client-side (3D) or server-side (Colyseus).
// ============================================

/** Minimal 2D vector (x, y) — maps to THREE.Vector2 or a plain object */
export interface IVec2 {
  x: number;
  y: number;
}

/** Minimal 3D vector (x, y, z) — maps to THREE.Vector3 or CANNON.Vec3 */
export interface IVec3 {
  x: number;
  y: number;
  z: number;
}

/** Minimal quaternion — maps to THREE.Quaternion or CANNON.Quaternion */
export interface IQuat {
  x: number;
  y: number;
  z: number;
  w: number;
}

// ============================================
// PHYSICS BODY INTERFACES
// ============================================

/** A physics body with position, velocity, and collision group config */
export interface ICombatBody {
  position: IVec3;
  velocity: IVec3;
  quaternion: IQuat;
  /** The object that owns this body (character, weapon, etc.) */
  belongTo: unknown;
  /** Collision group bitmask this body belongs to */
  collisionFilterGroup: number;
  /** Collision group bitmask this body can collide with */
  collisionFilterMask: number;
  /** If false, body passes through others (trigger volume) */
  collisionResponse: boolean;
}

/** Contact information from a collision event */
export interface ICollisionContact {
  /** Contact point relative to body i */
  ri: IVec3;
  /** Contact point relative to body j */
  rj: IVec3;
  /** Contact normal */
  ni: IVec3;
}

/** A collision event received by an attacker or character */
export interface ICollisionEvent {
  body: ICombatBody;
  contact: ICollisionContact;
}

// ============================================
// CHARACTER INTERFACES
// ============================================

/** A state machine service (XState or compatible) */
export interface IStateMachineService {
  state: {
    value: string;
    matches(value: string): boolean;
    hasTag(tag: string): boolean;
  };
  send(event: string | { type: string }): void;
  start(): void;
  stop(): void;
}

/** A combat-capable character (player or enemy) */
export interface ICombatCharacter {
  body: ICombatBody;
  mesh: { rotation: { y: number } };
  service: IStateMachineService;
  /** 2D movement direction (normalized) */
  direction: IVec2;
  /** 2D facing direction (determines rotation) */
  facing: IVec2;
  /** Movement speed (units per frame at 60 FPS) */
  speed: number;
  /** Initial spawn position for AI return-to-origin */
  initialPosition: IVec3;
  /** AI detection sphere radius */
  detectorRadius: number;

  /** Whether this is a player-controlled role */
  isRole?: boolean;
  /** Whether this is an enemy */
  isEnemy?: boolean;
  /** Whether the character is airborne */
  isAir?: boolean;
  /** Whether the character resists launch */
  isMassive?: boolean;
  /** Whether the model is loaded */
  gltf?: unknown;

  /** Called when this character takes a hit */
  hit(event: ICollisionEvent): void;
  /** Called when this character is knocked down */
  knockDown?(event: ICollisionEvent): void;
}

/** A target that an AI can track */
export type ICombatTarget = ICombatCharacter;

// ============================================
// ATTACKER / WEAPON INTERFACES
// ============================================

export interface IAttackerOptions {
  /** Number of hitbox bodies to create (default 1) */
  num?: number;
  /** Collision group for this attacker's bodies */
  collisionFilterGroup?: number;
  /** Collision mask for this attacker's bodies */
  collisionFilterMask?: number;
}

export interface IWeaponConfig {
  /** Weapon display name */
  name: string;
  /** Base damage value (integrates with @grudge/shared item.damage) */
  baseDamage: number;
  /** Hitbox dimensions */
  hitbox: { width: number; height: number; depth: number } | { radius: number };
  /** Collision group bitmask */
  collisionFilterGroup: number;
  /** Collision mask bitmask */
  collisionFilterMask: number;
}

export interface IProjectileConfig extends IWeaponConfig {
  /** Speed in units per frame at 60 FPS */
  speed: number;
  /** Lifetime in milliseconds before auto-dispose */
  lifetimeMs: number;
  /** Whether this projectile can be rebounded by attacker collisions */
  reboundable: boolean;
}

// ============================================
// EFFECTS INTERFACES
// ============================================

export interface ISplashConfig {
  /** Duration of the splash animation (seconds) */
  duration: number;
  /** How far the splash particle travels upward */
  riseDistance: number;
}

export interface IPopConfig {
  /** AoE sphere radius */
  radius: number;
  /** Knockback force magnitude */
  knockbackForce: number;
  /** Visual animation duration (seconds) */
  animDuration: number;
}

// ============================================
// INPUT INTERFACES
// ============================================

/** A sequential key combo definition */
export interface IComboDefinition {
  /** Ordered key sequence (e.g., ['KeyS', 'KeyD']) before the trigger key */
  sequence: string[];
  /** The trigger key that completes the combo (e.g., 'KeyJ') */
  triggerKey: string;
  /** The action name sent to the character's state machine */
  action: string;
}

/** Role controls configuration */
export interface IRoleControlsConfig {
  /** Movement keys mapping */
  moveKeys: {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
  };
  /** Attack / action key bindings */
  actionKeys: {
    attack: string[];
    jump: string[];
    dash: string[];
    bash: string[];
    block: string[];
    launch: string[];
  };
  /** Sequential key combo definitions */
  combos: IComboDefinition[];
  /** Time window for combo input (ms) */
  comboTimeoutMs: number;
}
