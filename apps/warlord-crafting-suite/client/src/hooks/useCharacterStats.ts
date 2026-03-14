/**
 * Hook for aggregated character stats
 * 
 * Provides a single source of truth for all character statistics,
 * combining base stats, equipment, profession bonuses, buffs, etc.
 */

import { useMemo } from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { 
  CharacterAggregator, 
  createCharacterAggregator,
  AggregatedCharacterState,
  formatStatValue,
  getStatDisplayName,
  getStatIcon,
  CRAFTING_BONUS_TYPES
} from '@shared/characterAggregator';
import { getDefaultAttributes } from '@shared/statCalculator';

// Import profession skill trees
import { minerData } from '@/data/miner';
import { foresterData } from '@/data/forester';
import { engineerData } from '@/data/engineer';
import { mysticData } from '@/data/mystic';
import { chefData } from '@/data/chef';

const PROFESSION_NODES: Record<string, any[]> = {
  Miner: minerData?.treeData || [],
  Forester: foresterData?.treeData || [],
  Engineer: engineerData?.treeData || [],
  Mystic: mysticData?.treeData || [],
  Chef: chefData?.treeData || [],
};

interface UseCharacterStatsOptions {
  includeEquipment?: boolean;
  includeProfessionBonuses?: boolean;
  includeBuffs?: boolean;
}

export function useCharacterStats(options: UseCharacterStatsOptions = {}): {
  state: AggregatedCharacterState | null;
  isLoading: boolean;
  getCraftingBonus: (bonusType: string, target?: string) => number;
  formatStat: (stat: string, value: number) => string;
  getStatName: (stat: string) => string;
  getStatIcon: (stat: string) => string;
} {
  const { character } = useCharacter();
  const {
    includeEquipment = true,
    includeProfessionBonuses = true,
    includeBuffs = true,
  } = options;

  const aggregatedState = useMemo(() => {
    if (!character) return null;

    const aggregator = createCharacterAggregator({
      id: character.id,
      name: character.name,
      classId: character.classId || null,
      raceId: character.raceId || null,
      level: character.level,
      experience: character.experience,
      gold: character.gold,
      attributes: (character.attributes as any) || getDefaultAttributes(),
      currentHealth: character.currentHealth,
      currentMana: character.currentMana,
      currentStamina: character.currentStamina,
      avatarUrl: character.avatarUrl,
    });

    // Add profession bonuses based on character level (simulated unlocks)
    if (includeProfessionBonuses) {
      // Add bonuses for ALL professions (game allows using all professions)
      const professions = ['Miner', 'Forester', 'Engineer', 'Mystic', 'Chef'];
      for (const prof of professions) {
        const nodes = PROFESSION_NODES[prof] || [];
        // Unlock nodes based on character level
        const unlockedNodeIds = nodes
          .filter(n => n.req <= character.level)
          .map(n => n.id);
        
        if (unlockedNodeIds.length > 0) {
          aggregator.addProfessionBonuses(prof, unlockedNodeIds, nodes);
        }
      }
    }

    // Add equipment stats from character's equipped items
    if (includeEquipment && character.equipment) {
      const equipment = character.equipment as Record<string, string | null>;
      for (const [slot, itemId] of Object.entries(equipment)) {
        if (itemId) {
          // For now, add placeholder equipment - in production this would fetch from item database
          aggregator.addEquipmentStats(slot, {
            slot,
            itemId,
            itemName: itemId,
            tier: 0,
            stats: {},
          });
        }
      }
    }

    // Add active buffs (from localStorage for now - could be from server/database)
    if (includeBuffs) {
      const savedBuffs = localStorage.getItem('character_active_buffs');
      if (savedBuffs) {
        try {
          const buffs = JSON.parse(savedBuffs);
          for (const buff of buffs) {
            if (buff.expiresAt > Date.now()) {
              aggregator.addBuff(buff);
            }
          }
        } catch (e) {
          console.warn('Failed to parse saved buffs:', e);
        }
      }
    }

    return aggregator.aggregate();
  }, [character, includeEquipment, includeProfessionBonuses, includeBuffs]);

  const getCraftingBonus = (bonusType: string, target?: string): number => {
    if (!aggregatedState) return 0;
    return aggregatedState.craftingBonuses
      .filter(m => m.bonusType === bonusType && (!target || !m.target || m.target === target))
      .reduce((sum, m) => sum + m.value, 0);
  };

  return {
    state: aggregatedState,
    isLoading: false,
    getCraftingBonus,
    formatStat: formatStatValue,
    getStatName: getStatDisplayName,
    getStatIcon,
  };
}

// Convenience hook for just crafting bonuses
export function useCraftingBonuses(): {
  bonuses: Record<string, number>;
  getBonus: (type: string, target?: string) => number;
  bonusTypes: typeof CRAFTING_BONUS_TYPES;
} {
  const { state, getCraftingBonus } = useCharacterStats({ includeProfessionBonuses: true });

  const bonuses = useMemo(() => {
    if (!state) return {};
    
    const result: Record<string, number> = {};
    for (const key of Object.keys(CRAFTING_BONUS_TYPES)) {
      result[key] = getCraftingBonus(key);
    }
    return result;
  }, [state, getCraftingBonus]);

  return {
    bonuses,
    getBonus: getCraftingBonus,
    bonusTypes: CRAFTING_BONUS_TYPES,
  };
}

// Hook for stat breakdown (for detailed UI)
export function useStatBreakdown(statName: string) {
  const { state } = useCharacterStats();

  return useMemo(() => {
    if (!state) return null;
    return state.statBreakdown[statName] || null;
  }, [state, statName]);
}
