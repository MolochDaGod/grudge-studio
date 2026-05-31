// @grudge/combat — Combat engine ported from annihilatetrainer
// https://github.com/AnnihilateTrainer

// Core
export { Attacker } from './Attacker.js';
export { Ai } from './Ai.js';
export { RoleControls } from './RoleControls.js';

// Constants
export * from './constants.js';

// Types
export type * from './types.js';

// AI archetypes
export { MutantAi, PaladinAi, RobotAi, RobotBossAi, ParrotAi } from './ai/index.js';

// Weapons
export { Sword, GreatSword, Bullet, Hadouken, Grenade, Shield, Flail } from './weapons/index.js';

// Effects
export { Splash, Pop } from './effects/index.js';
