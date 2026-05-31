import { Attacker } from '../Attacker.js';
import { GROUP_ENEMY_ATTACKER, GROUP_ROLE, GROUP_ROLE_ATTACKER, GROUP_ENEMY, BULLET_SPEED, BULLET_LIFETIME_MS } from '../constants.js';
import type { ICollisionEvent, IVec3, ICombatCharacter } from '../types.js';

type BulletState = 'move' | 'rebound' | 'disposed';

/**
 * Bullet — ranged projectile with rebound mechanic.
 * Ported from annihilatetrainer/src/Bullet.js
 *
 * Behaviour:
 * - Moves in a straight line from owner toward target direction
 * - If it hits a role → hit()
 * - If it hits a role attacker with 'canDamage' → reverses direction (rebound)
 * - If it hits an enemy (after rebound) → hit()
 * - Auto-disposes after BULLET_LIFETIME_MS
 */
export class Bullet extends Attacker {
  movement: IVec3;
  private _state: BulletState = 'move';
  private _disposeTimer: ReturnType<typeof setTimeout>;
  /** Callback for cleanup — set by the physics adapter */
  onDispose: (() => void) | null = null;

  constructor(owner: ICombatCharacter, targetDir: IVec3, speed = BULLET_SPEED) {
    super({
      collisionFilterGroup: GROUP_ENEMY_ATTACKER,
      collisionFilterMask: GROUP_ROLE | GROUP_ROLE_ATTACKER,
    });
    this.owner = owner;

    // Normalize direction and apply speed
    const len = Math.sqrt(targetDir.x ** 2 + targetDir.y ** 2 + targetDir.z ** 2) || 1;
    this.movement = {
      x: (targetDir.x / len) * speed,
      y: (targetDir.y / len) * speed,
      z: (targetDir.z / len) * speed,
    };

    // Copy owner position as starting point
    this.body.position.x = owner.body.position.x;
    this.body.position.y = owner.body.position.y;
    this.body.position.z = owner.body.position.z;

    this._disposeTimer = setTimeout(() => this.dispose(), BULLET_LIFETIME_MS);
  }

  update(dt: number): void {
    if (this._state === 'disposed') return;
    const scale = dt * 60;
    this.body.position.x += this.movement.x * scale;
    this.body.position.y += this.movement.y * scale;
    this.body.position.z += this.movement.z * scale;
  }

  collide(event: ICollisionEvent, isBeginCollide: boolean): void {
    if (!isBeginCollide || this._state === 'disposed') return;

    const target = event.body.belongTo as any;

    if (target?.isRole) {
      target.hit(event);
      this.dispose();
    } else if (target?.isAttacker && target.owner?.service.state.hasTag('canDamage')) {
      this._rebound();
    } else if (target?.isEnemy) {
      target.hit(event);
      this.dispose();
    }
  }

  private _rebound(): void {
    this._state = 'rebound';
    this.movement.x *= -1;
    this.movement.y *= -1;
    this.movement.z *= -1;
    this.body.collisionFilterGroup = GROUP_ROLE_ATTACKER;
    this.body.collisionFilterMask = GROUP_ENEMY;

    // Reset dispose timer
    clearTimeout(this._disposeTimer);
    this._disposeTimer = setTimeout(() => this.dispose(), BULLET_LIFETIME_MS);
  }

  dispose(): void {
    if (this._state === 'disposed') return;
    this._state = 'disposed';
    clearTimeout(this._disposeTimer);
    this.onDispose?.();
  }
}
