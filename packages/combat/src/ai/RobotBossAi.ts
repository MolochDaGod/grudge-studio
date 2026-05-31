import { Ai } from '../Ai.js';
import { AI_COOLDOWNS } from '../constants.js';
import type { ICombatCharacter } from '../types.js';

type BossPhase = 'idle' | 'attack' | 'attacked' | 'bash' | 'bashed';

/**
 * Robot Boss AI — multi-phase boss archetype.
 * Ported from annihilatetrainer/src/RobotBossAi.js
 *
 * Phase cycle: idle → attack (7s) → attacked (2s) → bash (7s) → bashed (2s) → idle
 * Boss is stationary (isMove = false), only rotates to face target.
 */
export class RobotBossAi extends Ai {
  private _phase: BossPhase = 'idle';
  private _phaseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(character: ICombatCharacter, distance = 1) {
    super(character, distance);
    this.isMove = false;
  }

  attack(): void {
    if (this._phase !== 'idle') return;
    this._setPhase('attack');
  }

  private _setPhase(phase: BossPhase): void {
    this._phase = phase;
    if (this._phaseTimer) clearTimeout(this._phaseTimer);

    switch (phase) {
      case 'attack':
        this.character.service.send('attack');
        this._phaseTimer = setTimeout(() => this._setPhase('attacked'), AI_COOLDOWNS.robotBoss);
        break;
      case 'attacked':
        this._phaseTimer = setTimeout(() => this._setPhase('bash'), 2000);
        break;
      case 'bash':
        this.character.service.send('bash');
        this._phaseTimer = setTimeout(() => this._setPhase('bashed'), AI_COOLDOWNS.robotBoss);
        break;
      case 'bashed':
        this._phaseTimer = setTimeout(() => this._setPhase('idle'), 2000);
        break;
      case 'idle':
        break;
    }
  }
}
