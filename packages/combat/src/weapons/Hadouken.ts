import { Bullet } from './Bullet.js';
import { HADOUKEN_RADIUS, BULLET_LIFETIME_MS } from '../constants.js';
import type { ICombatCharacter, IVec2 } from '../types.js';

/**
 * Hadouken — directional projectile that uses owner's facing direction.
 * Ported from annihilatetrainer/src/Hadouken.js
 *
 * Behaves like Bullet but moves along the XZ plane using the owner's
 * facing vector. Same rebound mechanic applies.
 */
export class Hadouken extends Bullet {
  radius = HADOUKEN_RADIUS;

  constructor(owner: ICombatCharacter, speed = 0.18) {
    // Use facing direction as movement vector (XZ plane)
    const facing = owner.facing as IVec2;
    const len = Math.sqrt(facing.x ** 2 + facing.y ** 2) || 1;
    super(owner, { x: (facing.x / len) * speed, y: 0, z: (facing.y / len) * speed }, speed);
  }
}
