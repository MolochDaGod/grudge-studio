import { INITIAL_POSITION_TOLERANCE_SQ } from './constants.js';
import type { ICombatCharacter, ICombatTarget, ICombatBody } from './types.js';

/**
 * Base AI controller.
 * Ported from annihilatetrainer/src/Ai.js
 *
 * Behaviour:
 * 1. When a target enters the detector radius → face, chase, and attack.
 * 2. When the target leaves → return to initial spawn position.
 * 3. When idle at spawn → send 'stop' to the character's state machine.
 *
 * The original used CANNON.Body as a detection sphere with beginContact/endContact.
 * This port is framework-agnostic: the physics adapter calls setTarget() when
 * a body enters/leaves the detector volume.
 */
export class Ai {
  character: ICombatCharacter;
  target: ICombatTarget | null = null;
  /** Minimum distance to target before attacking instead of chasing */
  distance: number;
  enabled = true;
  /** Whether this AI moves toward targets */
  isMove = true;
  /** Whether this AI attacks when in range */
  isAttack = true;

  /** Physics body used as a trigger volume for detection (set by adapter) */
  detector: ICombatBody | null = null;

  constructor(character: ICombatCharacter, distance = 1) {
    this.character = character;
    this.distance = distance;
  }

  /**
   * Per-frame update. Call from the game loop with delta time in seconds.
   */
  update(dt: number): void {
    if (!this.enabled) return;

    if (this.target) {
      // --- Face toward target, run near, and attack ---

      const dx = this.target.body.position.x - this.character.body.position.x;
      const dz = this.target.body.position.z - this.character.body.position.z;
      this.character.direction.x = dx;
      this.character.direction.y = dz;

      // Update facing if character state allows it
      if (this.character.service.state.hasTag('canFacing')) {
        this.character.facing.x = dx;
        this.character.facing.y = dz;
        this.character.mesh.rotation.y =
          -Math.atan2(this.character.facing.y, this.character.facing.x) + Math.PI / 2;
      }

      const dirLen = Math.sqrt(dx * dx + dz * dz);

      if (this.isMove && dirLen > this.distance) {
        // Chase
        this.character.service.send('run');
        const scale = (this.character.speed * dt * 60) / dirLen;
        if (this.character.service.state.hasTag('canMove')) {
          this.character.body.position.x += dx * scale;
          this.character.body.position.z += dz * scale;
        }
      } else {
        // In range — attack or idle
        if (this.isAttack) {
          this.attack();
        } else {
          this.character.service.send('stop');
        }
      }
    } else if (this.isMove) {
      // --- No target: return to initial position ---
      const homeX = this.character.initialPosition.x - this.character.body.position.x;
      const homeZ = this.character.initialPosition.z - this.character.body.position.z;
      const homeLenSq = homeX * homeX + homeZ * homeZ;

      if (homeLenSq > INITIAL_POSITION_TOLERANCE_SQ) {
        this.character.direction.x = homeX;
        this.character.direction.y = homeZ;
        this.character.service.send('run');

        this.character.facing.x = homeX;
        this.character.facing.y = homeZ;

        if (this.character.service.state.hasTag('canMove')) {
          this.character.mesh.rotation.y =
            -Math.atan2(this.character.facing.y, this.character.facing.x) + Math.PI / 2;

          const homeLen = Math.sqrt(homeLenSq);
          const scale = (this.character.speed * dt * 60) / homeLen;
          this.character.body.position.x += homeX * scale;
          this.character.body.position.z += homeZ * scale;
        }
      } else {
        this.character.service.send('stop');
      }
    } else {
      this.character.service.send('stop');
    }

    // Sync detector body position with character
    if (this.detector) {
      this.detector.position.x = this.character.body.position.x;
      this.detector.position.y = this.character.body.position.y;
      this.detector.position.z = this.character.body.position.z;
    }
  }

  /** Called by the physics adapter when a body enters the detection sphere */
  setTarget(target: ICombatTarget | null): void {
    this.target = target;
  }

  setCharacter(character: ICombatCharacter): void {
    this.character = character;
  }

  setDistance(distance: number): void {
    this.distance = distance;
  }

  /**
   * Override in subclass to implement attack-cooldown FSMs.
   * Base implementation just sends 'attack' to the character.
   */
  attack(): void {
    this.character.service.send('attack');
  }
}
