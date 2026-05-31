import { Attacker } from '../Attacker.js';
import { GROUP_ENEMY_ATTACKER, GROUP_ROLE } from '../constants.js';
import type { ICollisionEvent, IVec3, IQuat } from '../types.js';

/**
 * Sword — melee weapon that follows a bone delegate (e.g. hand bone).
 * Ported from annihilatetrainer/src/Sword.js
 *
 * The physics adapter syncs body position/quaternion to the delegate's
 * world transform each frame. Collision fires hit() on the target when
 * the owner's state machine has the 'canDamage' tag.
 */
export class Sword extends Attacker {
  /** World-space position getter — set by physics adapter from bone */
  delegatePosition: IVec3 = { x: 0, y: 0, z: 0 };
  /** World-space rotation getter — set by physics adapter from bone */
  delegateQuaternion: IQuat = { x: 0, y: 0, z: 0, w: 1 };

  constructor() {
    super({
      collisionFilterGroup: GROUP_ENEMY_ATTACKER,
      collisionFilterMask: GROUP_ROLE,
    });
  }

  update(): void {
    this.body.position.x = this.delegatePosition.x;
    this.body.position.y = this.delegatePosition.y;
    this.body.position.z = this.delegatePosition.z;
    this.body.quaternion.x = this.delegateQuaternion.x;
    this.body.quaternion.y = this.delegateQuaternion.y;
    this.body.quaternion.z = this.delegateQuaternion.z;
    this.body.quaternion.w = this.delegateQuaternion.w;
  }

  collide(event: ICollisionEvent, isBeginCollide: boolean): void {
    if (!isBeginCollide) return;
    if (this.owner?.service.state.hasTag('canDamage')) {
      (event.body.belongTo as any)?.hit?.(event);
    }
  }
}
