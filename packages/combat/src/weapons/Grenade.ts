import { Bullet } from './Bullet.js';
import type { ICombatCharacter, IVec3 } from '../types.js';

/**
 * Grenade — arcing projectile that explodes on landing.
 * Ported from annihilatetrainer/src/Grenade.js (simplified)
 *
 * Extends Bullet with gravity-affected arc trajectory.
 * Full implementation adds explosion AoE on contact/timeout.
 */
export class Grenade extends Bullet {
  /** Gravity acceleration applied per frame */
  gravity = 0.004;
  /** Launch angle factor */
  arcHeight: number;

  constructor(owner: ICombatCharacter, targetDir: IVec3, speed = 0.12, arcHeight = 0.08) {
    super(owner, targetDir, speed);
    this.arcHeight = arcHeight;
    // Add upward component for arc
    this.movement.y = arcHeight;
  }

  update(dt: number): void {
    // Apply gravity to y movement
    this.movement.y -= this.gravity * dt * 60;
    super.update(dt);
  }
}
