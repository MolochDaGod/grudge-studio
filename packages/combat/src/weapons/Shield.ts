import { GROUP_ENEMY_SHIELD, GROUP_ROLE_ATTACKER } from '../constants.js';
import type { ICombatBody, ICombatCharacter, IVec3, IQuat } from '../types.js';

/**
 * Shield — block/parry collider.
 * Ported from annihilatetrainer/src/Shield.js
 *
 * Not an Attacker subclass — shields don't deal damage, they absorb it.
 * The physics body uses GROUP_ENEMY_SHIELD and listens for collisions
 * from GROUP_ROLE_ATTACKER. When hit, the owner's GreatSword detects
 * the shield collision and sends 'blocked' to the shield owner.
 */
export class Shield {
  isShield = true;
  owner: ICombatCharacter | null = null;
  body: ICombatBody;
  /** Bone delegate position — updated by physics adapter */
  delegatePosition: IVec3 = { x: 0, y: 0, z: 0 };
  /** Bone delegate rotation — updated by physics adapter */
  delegateQuaternion: IQuat = { x: 0, y: 0, z: 0, w: 1 };

  constructor() {
    this.body = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      belongTo: this,
      collisionFilterGroup: GROUP_ENEMY_SHIELD,
      collisionFilterMask: GROUP_ROLE_ATTACKER,
      collisionResponse: false,
    };
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
}
