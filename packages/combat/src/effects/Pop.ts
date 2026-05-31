import { Attacker } from '../Attacker.js';
import { GROUP_ROLE_ATTACKER, GROUP_ENEMY, POP_RADIUS } from '../constants.js';
import type { ICollisionEvent, ICombatCharacter, IPopConfig } from '../types.js';

/**
 * Pop — AoE knockback burst.
 * Ported from annihilatetrainer/src/Pop.js
 *
 * Creates a sphere collider at the owner's position that pushes enemies
 * away and calls knockDown(). The physics body is added/removed from the
 * world in a single tick to create an instantaneous burst.
 *
 * Visual: cyan sphere that scales from 0→1 and fades out over animDuration.
 */
export class Pop extends Attacker {
  declare owner: ICombatCharacter;
  config: IPopConfig;

  constructor(owner: ICombatCharacter, config: Partial<IPopConfig> = {}) {
    super({
      collisionFilterGroup: GROUP_ROLE_ATTACKER,
      collisionFilterMask: GROUP_ENEMY,
    });
    this.owner = owner;
    this.config = {
      radius: config.radius ?? POP_RADIUS,
      knockbackForce: config.knockbackForce ?? 12,
      animDuration: config.animDuration ?? 0.2,
    };
  }

  update(): void {
    // Keep pop centered on owner
    this.body.position.x = this.owner.body.position.x;
    this.body.position.y = this.owner.body.position.y;
    this.body.position.z = this.owner.body.position.z;
  }

  collide(event: ICollisionEvent, isBeginCollide: boolean): void {
    if (!isBeginCollide) return;

    const target = event.body.belongTo as any;

    // Push away from owner
    const dx = event.body.position.x - this.owner.body.position.x;
    const dz = event.body.position.z - this.owner.body.position.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const force = this.config.knockbackForce;
    event.body.velocity.x = (dx / len) * force;
    event.body.velocity.z = (dz / len) * force;

    // Apply knockdown
    target?.knockDown?.(event);
  }

  /**
   * Trigger the pop burst. The physics adapter should:
   * 1. Add body to world
   * 2. Remove body next tick (setTimeout 0)
   * 3. Play the scale/fade animation using config
   */
  pop(): { radius: number; animDuration: number } {
    return {
      radius: this.config.radius,
      animDuration: this.config.animDuration,
    };
  }
}
