import { Ai } from '../Ai.js';
import { AI_COOLDOWNS } from '../constants.js';
import type { ICombatCharacter } from '../types.js';

/**
 * Parrot AI — ranged attacker archetype.
 * Ported from annihilatetrainer/src/ParrotAi.js
 *
 * Behaviour: 50/50 chance to use normal attack or grenade.
 * 3s cooldown between abilities.
 */
export class ParrotAi extends Ai {
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

    // 50/50 chance: normal attack or grenade
    if (Math.random() < 0.5) {
      this.character.service.send('attack');
    } else {
      this.character.service.send('grenade');
    }

    setTimeout(() => {
      this._canAttack = true;
    }, AI_COOLDOWNS.parrot);
  }
}
