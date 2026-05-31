import { Attacker } from '../Attacker.js';
import type { ICollisionEvent, IVec3 } from '../types.js';

/**
 * Flail — physics-chain melee weapon.
 * Ported from annihilatetrainer/src/Flail.js (simplified)
 *
 * The original uses Cannon-ES DistanceConstraints to create a chain of
 * spheres connecting the hand bone to the flail head. This port provides
 * the logic structure; the physics adapter must create the actual
 * constraint chain when instantiating in a Cannon-ES scene.
 */
export class Flail extends Attacker {
  /** Bone delegate position — chain anchor */
  delegatePosition: IVec3 = { x: 0, y: 0, z: 0 };
  /** Number of chain links */
  chainLength: number;

  constructor(chainLength = 5) {
    super();
    this.chainLength = chainLength;
  }

  collide(event: ICollisionEvent, isBeginCollide: boolean): void {
    if (!isBeginCollide) return;
    if (this.owner?.service.state.hasTag('canDamage')) {
      (event.body.belongTo as any)?.hit?.(event);
    }
  }
}
