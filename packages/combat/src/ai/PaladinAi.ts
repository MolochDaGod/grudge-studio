import { Ai } from '../Ai.js';
import { AI_COOLDOWNS } from '../constants.js';
import type { ICombatCharacter } from '../types.js';

/**
 * Paladin AI — tank / shield-bash archetype.
 * Ported from annihilatetrainer/src/PaladinAi.js
 *
 * Behaviour: Bash attack → 6s cooldown. Won't attack while airborne.
 */
export class PaladinAi extends Ai {
  private _canAttack = true;

  constructor(character: ICombatCharacter, distance = 1) {
    super(character, distance);
  }

  attack(): void {
    if (this.character.isAir) return;

    if (!this._canAttack) {
      this.character.service.send('stop');
      return;
    }

    this._canAttack = false;
    this.character.service.send('bash');

    setTimeout(() => {
      this._canAttack = true;
    }, AI_COOLDOWNS.paladin);
  }
}
