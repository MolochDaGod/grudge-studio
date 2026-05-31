import { GROUP_ROLE_ATTACKER, ROLE_ATTACKER_MASK } from './constants.js';
import type { ICombatBody, ICombatCharacter, ICollisionEvent, IAttackerOptions } from './types.js';

/**
 * Base attacker / hitbox manager.
 * Ported from annihilatetrainer/src/Attacker.js
 *
 * Manages one or more physics bodies used as attack hitboxes.
 * Tracks active collisions (collidings) so subclasses can distinguish
 * beginCollide from sustained contact.
 *
 * Subclasses override collide() and endContact() to implement weapon-specific
 * hit logic (melee damage, projectile rebound, shield block, etc.)
 */
export class Attacker {
  isAttacker = true;
  owner: ICombatCharacter | null = null;
  bodies: ICombatBody[] = [];
  /** Convenience — first body in the list */
  body: ICombatBody;

  /** Per-body tracking of currently-colliding bodies */
  private _collidingsMap = new Map<ICombatBody, ICombatBody[]>();

  constructor(options: IAttackerOptions = {}) {
    const {
      num = 1,
      collisionFilterGroup = GROUP_ROLE_ATTACKER,
      collisionFilterMask = ROLE_ATTACKER_MASK,
    } = options;

    // Create placeholder body descriptors.
    // The actual physics body creation is left to the renderer/physics adapter
    // that wires up Cannon-ES or a server-side sim.
    for (let i = 0; i < num; i++) {
      const body: ICombatBody = {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        quaternion: { x: 0, y: 0, z: 0, w: 1 },
        belongTo: this,
        collisionFilterGroup,
        collisionFilterMask,
        collisionResponse: false,
      };
      this.bodies.push(body);
      this._collidingsMap.set(body, []);
    }

    this.body = this.bodies[0];
  }

  // --------------------------------------------------
  // Collision pipeline — call from physics event handler
  // --------------------------------------------------

  /**
   * Called by the physics adapter on every contact tick.
   * Determines whether this is a new contact (beginCollide) and
   * delegates to the overridable collide() hook.
   */
  handleCollide(body: ICombatBody, event: ICollisionEvent): void {
    const collidings = this._collidingsMap.get(body) ?? [];
    const isBeginCollide = !collidings.includes(event.body);
    if (isBeginCollide) {
      collidings.push(event.body);
    }
    this.collide(event, isBeginCollide);
  }

  /**
   * Called by the physics adapter when a body leaves contact.
   */
  handleEndContact(body: ICombatBody, event: ICollisionEvent): void {
    const collidings = this._collidingsMap.get(body) ?? [];
    const idx = collidings.indexOf(event.body);
    if (idx !== -1) collidings.splice(idx, 1);
    this.endContact(event);
  }

  // --------------------------------------------------
  // Override points for subclasses
  // --------------------------------------------------

  /** Called on collision. Override in weapon subclass. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  collide(_event: ICollisionEvent, _isBeginCollide: boolean): void {
    // Base does nothing — subclass implements hit/rebound logic
  }

  /** Called when contact ends. Override if needed. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endContact(_event: ICollisionEvent): void {}

  /** Per-frame update. Override for position sync, projectile movement, etc. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_dt: number): void {}
}
