import { Ai } from '../Ai.js';
import { AI_COOLDOWNS } from '../constants.js';
import type { ICombatCharacter } from '../types.js';

/**
 * Mutant AI — melee bruiser archetype.
 * Ported from annihilatetrainer/src/MutantAi.js
 *
 * Behaviour: Attack → 4s cooldown → attack again.
 * Uses a held-attack pattern: sends 'attack', then 'keyJUp' after 1.6s.
 */
export class MutantAi extends Ai {
  private _canAttack = true;
  private _cooldownTimer: ReturnType<typeof setTimeout> | null = null;

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

    // Release attack key after hold duration
    setTimeout(() => {
      this.character.service.send('keyJUp');
    }, 1600);

    // Cooldown before next attack
    this._cooldownTimer = setTimeout(() => {
      this._canAttack = true;
    }, AI_COOLDOWNS.mutant);
  }
}
