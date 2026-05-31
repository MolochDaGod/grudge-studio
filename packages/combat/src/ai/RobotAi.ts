import { Ai } from '../Ai.js';
import { AI_COOLDOWNS } from '../constants.js';
import type { ICombatCharacter } from '../types.js';

/**
 * Robot AI — standard melee attacker archetype.
 * Ported from annihilatetrainer/src/RobotAi.js
 *
 * Behaviour: Attack → 4s cooldown → attack again.
 */
export class RobotAi extends Ai {
  private _canAttack = true;

  constructor(character: ICombatCharacter, distance = 1) {
    super(character, distance);
  }

  attack(): void {
    if (!this._canAttack) {
      this.character.service.send('stop');
      return;
    }

    this._canAttack = false;
    this.character.service.send('attack');

    setTimeout(() => {
      this._canAttack = true;
    }, AI_COOLDOWNS.robot);
  }
}
