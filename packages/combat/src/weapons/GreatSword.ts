import { Attacker } from '../Attacker.js';
import { GROUP_ROLE_ATTACKER, ROLE_ATTACKER_MASK } from '../constants.js';
import type { ICollisionEvent, IVec3, IQuat, ICombatCharacter } from '../types.js';

/**
 * GreatSword — player melee weapon with shield-block detection and launch.
 * Ported from annihilatetrainer/src/GreatSword.js
 *
 * Per-frame logic:
 * - Tracks bone delegate position (like Sword)
 * - Prioritizes shield collisions over body collisions
 * - If shield hit → sends 'blocked' to shield owner
 * - If body hit + 'knockDown' tag → knockDown
 * - If body hit + 'canLaunch' tag → launches non-massive, grounded enemies
 */
export class GreatSword extends Attacker {
  delegatePosition: IVec3 = { x: 0, y: 0, z: 0 };
  delegateQuaternion: IQuat = { x: 0, y: 0, z: 0, w: 1 };

  private _isCollideShield = false;
  private _isCollideBody = false;
  private _collideShieldEvent: ICollisionEvent | null = null;
  private _collideBodyEvent: ICollisionEvent | null = null;

  constructor() {
    super({
      collisionFilterGroup: GROUP_ROLE_ATTACKER,
      collisionFilterMask: ROLE_ATTACKER_MASK,
    });
  }

  update(): void {
    // Sync position to bone
    this.body.position.x = this.delegatePosition.x;
    this.body.position.y = this.delegatePosition.y;
    this.body.position.z = this.delegatePosition.z;
    this.body.quaternion.x = this.delegateQuaternion.x;
    this.body.quaternion.y = this.delegateQuaternion.y;
    this.body.quaternion.z = this.delegateQuaternion.z;
    this.body.quaternion.w = this.delegateQuaternion.w;

    // Resolve shield vs body priority (runs one tick after collide)
    if (this._isCollideShield && this._collideShieldEvent) {
      const shieldOwner = (this._collideShieldEvent.body.belongTo as any)?.owner as ICombatCharacter | undefined;
      shieldOwner?.service.send('blocked');
    } else if (this._isCollideBody && this._collideBodyEvent) {
      const target = this._collideBodyEvent.body.belongTo as any;
      if (this.owner?.service.state.hasTag('knockDown')) {
        target?.knockDown?.(this._collideBodyEvent);
      } else {
        target?.hit?.(this._collideBodyEvent);
        // Launch non-massive grounded enemies if owner has 'canLaunch' tag
        if (this.owner?.service.state.hasTag('canLaunch') && !target?.isAir && !target?.isMassive) {
          target.isAir = true;
        }
      }
    }

    // Reset for next frame
    this._isCollideShield = false;
    this._isCollideBody = false;
    this._collideShieldEvent = null;
    this._collideBodyEvent = null;
  }

  collide(event: ICollisionEvent, isBeginCollide: boolean): void {
    if (!isBeginCollide) return;
    if (!this.owner?.service.state.hasTag('canDamage')) return;

    const target = event.body.belongTo as any;
    if (target?.isShield) {
      this._isCollideShield = true;
      this._collideShieldEvent = { ...event };
    } else if (target?.isEnemy) {
      this._isCollideBody = true;
      this._collideBodyEvent = { ...event };
    }
  }
}
