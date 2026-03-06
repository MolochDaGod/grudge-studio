export interface AbilitySlot {
  name: string;
  tooltip: string;
  cooldown: number;
  manaCost: number;
  damage?: string;
  effect?: string;
}

export interface WeaponAbilities {
  slot1: AbilitySlot;
  slot2: AbilitySlot;
  slot3: AbilitySlot | null;
  slot4: AbilitySlot | null;
}

export interface WeaponStats {
  damage: { base: number; perTier: number };
  speed: { base: number; perTier: number };
  combo: { base: number; perTier: number };
  crit: { base: number; perTier: number };
  block: { base: number; perTier: number };
  defense: { base: number; perTier: number };
}

export interface PassiveEffect {
  name: string;
  description: string;
  value: number;
}

export interface WeaponComplete {
  id: string;
  name: string;
  type: string;
  category: '1h' | '2h' | 'Ranged 2h' | 'Offhand';
  tier: number;
  lore: string;
  stats: WeaponStats;
  abilities: WeaponAbilities;
  passives: PassiveEffect[];
  craftedBy: 'Miner' | 'Forester' | 'Engineer' | 'Mystic' | 'Chef';
  sprite: string;
  requiredMaterials: { materialId: string; quantity: number }[];
  craftTime: number;
}

const SPRITE_BASE = '/2dassets/sprites';

export const T0_WEAPONS: WeaponComplete[] = [
  {
    id: 't0-sword-rusty',
    name: 'Rusty Sword',
    type: 'Sword',
    category: '1h',
    tier: 0,
    lore: 'A worn blade, barely sharp enough to cut bread.',
    stats: {
      damage: { base: 15, perTier: 0 },
      speed: { base: 80, perTier: 0 },
      combo: { base: 0, perTier: 0 },
      crit: { base: 1, perTier: 0 },
      block: { base: 2, perTier: 0 },
      defense: { base: 5, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Basic Slash',
        tooltip: 'A simple slash attack dealing weapon damage. Generates 1 combo point.',
        cooldown: 0,
        manaCost: 0,
        damage: '100% weapon damage',
        effect: 'Generates 1 combo point'
      },
      slot2: {
        name: 'Quick Strike',
        tooltip: 'A fast attack that deals reduced damage but has a short cooldown. Good for building combo points quickly.',
        cooldown: 3,
        manaCost: 5,
        damage: '80% weapon damage',
        effect: 'Generates 2 combo points'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Worn Edge', description: 'Deals 5% less damage due to dull blade', value: -5 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/sword/rusty-sword.png`,
    requiredMaterials: [
      { materialId: 'scrap-metal', quantity: 2 },
      { materialId: 'wood-stick', quantity: 1 }
    ],
    craftTime: 5
  },
  {
    id: 't0-axe-chipped',
    name: 'Chipped Axe',
    type: 'Axe',
    category: '1h',
    tier: 0,
    lore: 'A woodcutter\'s axe past its prime.',
    stats: {
      damage: { base: 18, perTier: 0 },
      speed: { base: 90, perTier: 0 },
      combo: { base: 0, perTier: 0 },
      crit: { base: 1, perTier: 0 },
      block: { base: 1, perTier: 0 },
      defense: { base: 4, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Chop',
        tooltip: 'A heavy chop dealing weapon damage. Has a chance to apply bleed.',
        cooldown: 0,
        manaCost: 0,
        damage: '110% weapon damage',
        effect: '10% chance to apply 1 bleed stack'
      },
      slot2: {
        name: 'Rending Blow',
        tooltip: 'A forceful strike that applies bleed to the target.',
        cooldown: 5,
        manaCost: 8,
        damage: '90% weapon damage',
        effect: 'Applies 1 bleed stack (3s duration)'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Splintered', description: '5% chance attacks miss due to chipped edge', value: 5 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/axe/chipped-axe.png`,
    requiredMaterials: [
      { materialId: 'scrap-metal', quantity: 3 },
      { materialId: 'wood-stick', quantity: 1 }
    ],
    craftTime: 5
  },
  {
    id: 't0-dagger-blunt',
    name: 'Blunt Dagger',
    type: 'Dagger',
    category: '1h',
    tier: 0,
    lore: 'More of a butter knife than a weapon.',
    stats: {
      damage: { base: 12, perTier: 0 },
      speed: { base: 60, perTier: 0 },
      combo: { base: 10, perTier: 0 },
      crit: { base: 3, perTier: 0 },
      block: { base: 1, perTier: 0 },
      defense: { base: 3, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Stab',
        tooltip: 'A quick stab attack. Fast attack speed makes up for low damage.',
        cooldown: 0,
        manaCost: 0,
        damage: '90% weapon damage',
        effect: 'Generates 2 combo points'
      },
      slot2: {
        name: 'Backstab',
        tooltip: 'Deals bonus damage when attacking from behind.',
        cooldown: 4,
        manaCost: 6,
        damage: '120% weapon damage (200% from behind)',
        effect: 'Bonus crit chance from behind'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Dull Point', description: 'Critical hits deal 10% less bonus damage', value: -10 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/dagger/blunt-dagger.png`,
    requiredMaterials: [
      { materialId: 'scrap-metal', quantity: 1 },
      { materialId: 'wood-stick', quantity: 1 }
    ],
    craftTime: 3
  },
  {
    id: 't0-hammer-worn',
    name: 'Worn Hammer',
    type: 'Hammer1h',
    category: '1h',
    tier: 0,
    lore: 'An old blacksmith\'s hammer repurposed for combat.',
    stats: {
      damage: { base: 20, perTier: 0 },
      speed: { base: 100, perTier: 0 },
      combo: { base: 0, perTier: 0 },
      crit: { base: 1, perTier: 0 },
      block: { base: 4, perTier: 0 },
      defense: { base: 8, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Bash',
        tooltip: 'A heavy bash that deals damage and has a chance to stun.',
        cooldown: 0,
        manaCost: 0,
        damage: '100% weapon damage',
        effect: '5% chance to stun for 0.5s'
      },
      slot2: {
        name: 'Ground Pound',
        tooltip: 'Slam the ground dealing AoE damage and slowing enemies.',
        cooldown: 6,
        manaCost: 10,
        damage: '80% weapon damage AoE',
        effect: 'Slows enemies by 20% for 2s'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Heavy Swing', description: 'Attacks are 10% slower', value: 10 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/hammer/worn-hammer.png`,
    requiredMaterials: [
      { materialId: 'scrap-metal', quantity: 4 },
      { materialId: 'wood-stick', quantity: 2 }
    ],
    craftTime: 6
  },
  {
    id: 't0-bow-simple',
    name: 'Simple Bow',
    type: 'Bow',
    category: 'Ranged 2h',
    tier: 0,
    lore: 'A hunting bow made from bent wood and twine.',
    stats: {
      damage: { base: 14, perTier: 0 },
      speed: { base: 70, perTier: 0 },
      combo: { base: 15, perTier: 0 },
      crit: { base: 4, perTier: 0 },
      block: { base: 0, perTier: 0 },
      defense: { base: 2, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Shoot',
        tooltip: 'Fire an arrow at the target dealing weapon damage.',
        cooldown: 0,
        manaCost: 0,
        damage: '100% weapon damage',
        effect: 'Range: 25m'
      },
      slot2: {
        name: 'Aimed Shot',
        tooltip: 'Take careful aim for increased damage and crit chance.',
        cooldown: 5,
        manaCost: 8,
        damage: '150% weapon damage',
        effect: '+15% crit chance, 1.5s cast time'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Weak String', description: 'Range reduced by 5m', value: -5 }
    ],
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/bow/simple-bow.png`,
    requiredMaterials: [
      { materialId: 'wood-stick', quantity: 3 },
      { materialId: 'string', quantity: 2 }
    ],
    craftTime: 5
  },
  {
    id: 't0-crossbow-makeshift',
    name: 'Makeshift Crossbow',
    type: 'Crossbow',
    category: 'Ranged 2h',
    tier: 0,
    lore: 'A crude crossbow held together with rope and hope.',
    stats: {
      damage: { base: 18, perTier: 0 },
      speed: { base: 85, perTier: 0 },
      combo: { base: 10, perTier: 0 },
      crit: { base: 3, perTier: 0 },
      block: { base: 1, perTier: 0 },
      defense: { base: 3, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Fire Bolt',
        tooltip: 'Fire a crossbow bolt at the target.',
        cooldown: 0,
        manaCost: 0,
        damage: '100% weapon damage',
        effect: 'Range: 30m, slow reload'
      },
      slot2: {
        name: 'Power Shot',
        tooltip: 'A powerful shot that pierces through enemies.',
        cooldown: 6,
        manaCost: 10,
        damage: '130% weapon damage',
        effect: 'Pierces through first target'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Unreliable', description: '5% chance bolt jams (attack fails)', value: 5 }
    ],
    craftedBy: 'Engineer',
    sprite: `${SPRITE_BASE}/crossbow/makeshift-crossbow.png`,
    requiredMaterials: [
      { materialId: 'wood-stick', quantity: 4 },
      { materialId: 'scrap-metal', quantity: 2 },
      { materialId: 'string', quantity: 2 }
    ],
    craftTime: 8
  },
  {
    id: 't0-gun-flintlock',
    name: 'Old Flintlock',
    type: 'Gun',
    category: 'Ranged 2h',
    tier: 0,
    lore: 'An antique firearm that still goes bang... sometimes.',
    stats: {
      damage: { base: 22, perTier: 0 },
      speed: { base: 95, perTier: 0 },
      combo: { base: 20, perTier: 0 },
      crit: { base: 5, perTier: 0 },
      block: { base: 0, perTier: 0 },
      defense: { base: 2, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Fire',
        tooltip: 'Fire a single shot. Long reload time but high damage.',
        cooldown: 0,
        manaCost: 0,
        damage: '120% weapon damage',
        effect: 'Range: 20m, 2s reload'
      },
      slot2: {
        name: 'Powder Blast',
        tooltip: 'Fire an explosive shot that damages nearby enemies.',
        cooldown: 8,
        manaCost: 12,
        damage: '100% weapon damage + 50% AoE',
        effect: '3m AoE radius'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Misfires', description: '8% chance shot misfires (50% damage)', value: 8 }
    ],
    craftedBy: 'Engineer',
    sprite: `${SPRITE_BASE}/gun/old-flintlock.png`,
    requiredMaterials: [
      { materialId: 'scrap-metal', quantity: 5 },
      { materialId: 'wood-stick', quantity: 2 },
      { materialId: 'gunpowder', quantity: 1 }
    ],
    craftTime: 10
  },
  {
    id: 't0-staff-apprentice',
    name: 'Apprentice Staff',
    type: 'Staff',
    category: 'Ranged 2h',
    tier: 0,
    lore: 'A novice mage\'s first channeling focus.',
    stats: {
      damage: { base: 16, perTier: 0 },
      speed: { base: 65, perTier: 0 },
      combo: { base: 50, perTier: 0 },
      crit: { base: 3, perTier: 0 },
      block: { base: 0, perTier: 0 },
      defense: { base: 4, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Magic Bolt',
        tooltip: 'Fire a bolt of arcane energy at the target.',
        cooldown: 0,
        manaCost: 5,
        damage: '100% magic damage',
        effect: 'Range: 25m'
      },
      slot2: {
        name: 'Mana Spark',
        tooltip: 'Releases stored mana as a damaging burst.',
        cooldown: 4,
        manaCost: 10,
        damage: '80% magic damage AoE',
        effect: '4m radius, restores 5 mana on hit'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Unstable Focus', description: 'Spells cost 10% more mana', value: 10 }
    ],
    craftedBy: 'Mystic',
    sprite: `${SPRITE_BASE}/staff/apprentice-staff.png`,
    requiredMaterials: [
      { materialId: 'wood-stick', quantity: 3 },
      { materialId: 'minor-essence', quantity: 2 }
    ],
    craftTime: 8
  },
  {
    id: 't0-tome-tattered',
    name: 'Tattered Tome',
    type: 'Tome',
    category: 'Offhand',
    tier: 0,
    lore: 'Pages are missing but some spells remain legible.',
    stats: {
      damage: { base: 8, perTier: 0 },
      speed: { base: 0, perTier: 0 },
      combo: { base: 30, perTier: 0 },
      crit: { base: 2, perTier: 0 },
      block: { base: 0, perTier: 0 },
      defense: { base: 2, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Minor Ward',
        tooltip: 'Creates a small shield absorbing incoming damage.',
        cooldown: 10,
        manaCost: 15,
        effect: 'Absorbs 50 damage for 5s'
      },
      slot2: {
        name: 'Mana Transfer',
        tooltip: 'Converts health into mana.',
        cooldown: 8,
        manaCost: 0,
        effect: 'Sacrifice 20 HP to restore 30 mana'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Faded Ink', description: '+5% spell mana cost', value: 5 }
    ],
    craftedBy: 'Mystic',
    sprite: `${SPRITE_BASE}/tome/tattered-tome.png`,
    requiredMaterials: [
      { materialId: 'linen-cloth', quantity: 3 },
      { materialId: 'minor-essence', quantity: 1 }
    ],
    craftTime: 6
  },
  {
    id: 't0-greatsword-heavy',
    name: 'Heavy Iron Blade',
    type: 'Greatsword',
    category: '2h',
    tier: 0,
    lore: 'Unwieldy but packs a punch.',
    stats: {
      damage: { base: 25, perTier: 0 },
      speed: { base: 110, perTier: 0 },
      combo: { base: 0, perTier: 0 },
      crit: { base: 2, perTier: 0 },
      block: { base: 3, perTier: 0 },
      defense: { base: 10, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Heavy Slash',
        tooltip: 'A slow but powerful slash in a wide arc.',
        cooldown: 0,
        manaCost: 0,
        damage: '130% weapon damage',
        effect: 'Cleaves up to 3 enemies'
      },
      slot2: {
        name: 'Overhead Smash',
        tooltip: 'Bring the blade down with tremendous force.',
        cooldown: 6,
        manaCost: 12,
        damage: '180% weapon damage',
        effect: '10% chance to stun for 1s'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Cumbersome', description: 'Attack speed reduced by 15%', value: 15 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/greatsword/heavy-iron-blade.png`,
    requiredMaterials: [
      { materialId: 'scrap-metal', quantity: 6 },
      { materialId: 'wood-stick', quantity: 2 }
    ],
    craftTime: 10
  },
  {
    id: 't0-greataxe-lumber',
    name: 'Lumber Axe',
    type: 'Greataxe',
    category: '2h',
    tier: 0,
    lore: 'Better suited for trees than enemies.',
    stats: {
      damage: { base: 28, perTier: 0 },
      speed: { base: 120, perTier: 0 },
      combo: { base: 0, perTier: 0 },
      crit: { base: 1, perTier: 0 },
      block: { base: 2, perTier: 0 },
      defense: { base: 8, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Timber Strike',
        tooltip: 'A devastating swing meant for felling trees.',
        cooldown: 0,
        manaCost: 0,
        damage: '140% weapon damage',
        effect: 'Applies 1 bleed stack'
      },
      slot2: {
        name: 'Cleaving Arc',
        tooltip: 'Swing in a wide arc hitting all enemies in front.',
        cooldown: 7,
        manaCost: 15,
        damage: '110% weapon damage',
        effect: 'Hits all enemies in a 180° arc'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Forestry Tool', description: 'Not designed for combat (-5% accuracy)', value: 5 }
    ],
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/greataxe/lumber-axe.png`,
    requiredMaterials: [
      { materialId: 'scrap-metal', quantity: 5 },
      { materialId: 'wood-stick', quantity: 4 }
    ],
    craftTime: 10
  },
  {
    id: 't0-hammer2h-sledge',
    name: 'Mining Sledge',
    type: 'Hammer2h',
    category: '2h',
    tier: 0,
    lore: 'A miner\'s sledgehammer, heavy and brutal.',
    stats: {
      damage: { base: 30, perTier: 0 },
      speed: { base: 130, perTier: 0 },
      combo: { base: 0, perTier: 0 },
      crit: { base: 1, perTier: 0 },
      block: { base: 5, perTier: 0 },
      defense: { base: 12, perTier: 0 }
    },
    abilities: {
      slot1: {
        name: 'Crush',
        tooltip: 'A crushing blow that ignores some armor.',
        cooldown: 0,
        manaCost: 0,
        damage: '120% weapon damage',
        effect: 'Ignores 10% of target armor'
      },
      slot2: {
        name: 'Earthquake',
        tooltip: 'Slam the ground creating a shockwave.',
        cooldown: 8,
        manaCost: 18,
        damage: '90% weapon damage AoE',
        effect: 'Slows all enemies hit by 30% for 3s'
      },
      slot3: null,
      slot4: null
    },
    passives: [
      { name: 'Exhausting', description: 'Drains 5 stamina per attack', value: 5 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/hammer/mining-sledge.png`,
    requiredMaterials: [
      { materialId: 'scrap-metal', quantity: 7 },
      { materialId: 'wood-stick', quantity: 3 }
    ],
    craftTime: 12
  }
];

export const T1_SWORDS: WeaponComplete[] = [
  {
    id: 't1-sword-bloodfeud',
    name: 'Bloodfeud Blade',
    type: 'Sword',
    category: '1h',
    tier: 1,
    lore: 'Forged in endless clan blood feuds, this blade thirsts for vengeance.',
    stats: {
      damage: { base: 50, perTier: 12 },
      speed: { base: 100, perTier: 25 },
      combo: { base: 0, perTier: 0 },
      crit: { base: 3, perTier: 0.5 },
      block: { base: 5, perTier: 1 },
      defense: { base: 20, perTier: 6 }
    },
    abilities: {
      slot1: {
        name: 'Vengeful Slash',
        tooltip: 'A fierce slash that builds Grudge Mark stacks on the target. Each stack increases your damage against them by 5%. Maximum 3 stacks.',
        cooldown: 0,
        manaCost: 0,
        damage: '100% weapon damage',
        effect: 'Applies Grudge Mark (5% damage amp per stack, max 3)'
      },
      slot2: {
        name: 'Blood Rush',
        tooltip: 'Dash forward 8 meters, dealing damage to all enemies in your path. Generates 2 Grudge Marks on each enemy hit.',
        cooldown: 12,
        manaCost: 20,
        damage: '120% weapon damage AoE',
        effect: 'Dash 8m, applies 2 Grudge Marks to each enemy hit'
      },
      slot3: {
        name: 'Iron Grudge',
        tooltip: 'Enter a defensive stance for 3 seconds, reducing incoming damage by 40% and reflecting 20% of blocked damage back to attackers.',
        cooldown: 18,
        manaCost: 25,
        effect: '40% damage reduction, 20% reflect for 3s'
      },
      slot4: {
        name: 'Crimson Reprisal',
        tooltip: 'ULTIMATE: Unleash a massive AoE slash that consumes all Grudge Marks on nearby enemies. Heals you for 5% of your max HP per enemy hit. Healing doubled for enemies with 3 Grudge Marks.',
        cooldown: 45,
        manaCost: 50,
        damage: '200% weapon damage AoE',
        effect: 'Heals 5% max HP per enemy hit, 10% if 3 marks'
      }
    },
    passives: [
      { name: 'Bloodlust', description: '5% of damage dealt is returned as health', value: 5 },
      { name: 'Swift Vengeance', description: 'Attack speed increased by 15%', value: 15 },
      { name: 'Deep Cuts', description: 'Bleed damage increased by 20%', value: 20 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/sword/bloodfeud-blade.png`,
    requiredMaterials: [
      { materialId: 'copper-ingot', quantity: 5 },
      { materialId: 'pine-plank', quantity: 2 },
      { materialId: 'string', quantity: 1 }
    ],
    craftTime: 30
  },
  {
    id: 't1-sword-wraithfang',
    name: 'Wraithfang',
    type: 'Sword',
    category: '1h',
    tier: 1,
    lore: 'Whispers forgotten grudges in the dark, striking from shadows.',
    stats: {
      damage: { base: 55, perTier: 13 },
      speed: { base: 80, perTier: 20 },
      combo: { base: 20, perTier: 10 },
      crit: { base: 5, perTier: 0.8 },
      block: { base: 3, perTier: 0.8 },
      defense: { base: 15, perTier: 5 }
    },
    abilities: {
      slot1: {
        name: 'Vengeful Slash',
        tooltip: 'A swift slash that applies Grudge Marks. Critical hits apply 2 marks instead of 1.',
        cooldown: 0,
        manaCost: 0,
        damage: '100% weapon damage',
        effect: 'Applies 1 Grudge Mark (2 on crit)'
      },
      slot2: {
        name: 'Shadow Edge',
        tooltip: 'Dash through shadows 6m and emerge behind your target, stunning them for 1 second.',
        cooldown: 10,
        manaCost: 18,
        damage: '130% weapon damage',
        effect: 'Teleport behind target, 1s stun'
      },
      slot3: {
        name: 'Execute',
        tooltip: 'A devastating strike that deals 50% bonus damage to targets below 30% health.',
        cooldown: 15,
        manaCost: 22,
        damage: '150% weapon damage (225% vs <30% HP)',
        effect: 'Execute bonus vs low HP targets'
      },
      slot4: {
        name: 'Night\'s Judgment',
        tooltip: 'ULTIMATE: Teleport behind the target and unleash a flurry of strikes, applying a powerful bleed that deals 300% weapon damage over 6 seconds.',
        cooldown: 50,
        manaCost: 55,
        damage: '180% initial + 300% bleed over 6s',
        effect: 'Teleport + massive bleed DoT'
      }
    },
    passives: [
      { name: 'Life Leech', description: 'Heal for 3% of damage dealt', value: 3 },
      { name: 'Aggressive Rush', description: 'Gain 10% attack speed when Grudge Marks are active', value: 10 },
      { name: 'Grudge Explosion', description: 'Grudge Marks explode for 20% weapon damage when consumed', value: 20 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/sword/wraithfang.png`,
    requiredMaterials: [
      { materialId: 'copper-ingot', quantity: 6 },
      { materialId: 'pine-plank', quantity: 2 },
      { materialId: 'minor-essence', quantity: 1 }
    ],
    craftTime: 35
  }
];

export const T1_AXES: WeaponComplete[] = [
  {
    id: 't1-axe-gorehowl',
    name: 'Gorehowl',
    type: 'Axe',
    category: '1h',
    tier: 1,
    lore: 'Howls with the gore of fallen foes, thirsting for blood in every swing.',
    stats: {
      damage: { base: 60, perTier: 15 },
      speed: { base: 120, perTier: 30 },
      combo: { base: 0, perTier: 0 },
      crit: { base: 2, perTier: 0.4 },
      block: { base: 4, perTier: 1 },
      defense: { base: 25, perTier: 8 }
    },
    abilities: {
      slot1: {
        name: 'Rending Chop',
        tooltip: 'A brutal chop that applies Bleed stacks to the target. Each stack deals 5% weapon damage per second for 6 seconds. Maximum 5 stacks.',
        cooldown: 0,
        manaCost: 0,
        damage: '110% weapon damage',
        effect: 'Applies 1 Bleed stack (5% dmg/s for 6s, max 5)'
      },
      slot2: {
        name: 'Adrenaline Surge',
        tooltip: 'Channel your rage to increase attack speed by 30% for 5 seconds. Each hit extends duration by 0.5 seconds.',
        cooldown: 15,
        manaCost: 20,
        effect: '+30% attack speed for 5s, extends on hit'
      },
      slot3: {
        name: 'Whirl of Pain',
        tooltip: 'Spin rapidly for 3 seconds, dealing damage to all nearby enemies. Each enemy hit refreshes all Bleed stacks on them.',
        cooldown: 18,
        manaCost: 30,
        damage: '60% weapon damage per 0.5s',
        effect: 'Channeled AoE, refreshes Bleeds'
      },
      slot4: {
        name: 'Apocalypse Cleave',
        tooltip: 'ULTIMATE: Unleash a devastating cleave that deals massive damage and knocks back all enemies. Enemies with 5 Bleed stacks take 100% bonus damage.',
        cooldown: 45,
        manaCost: 50,
        damage: '250% weapon damage (500% vs 5 stacks)',
        effect: 'Large knockback AoE'
      }
    },
    passives: [
      { name: 'Life Leech', description: 'Heal for 5% of damage dealt to bleeding targets', value: 5 },
      { name: 'Bleed Mastery', description: 'Bleed damage increased by 25%', value: 25 },
      { name: 'Vicious Wounds', description: 'Bleeding enemies are slowed by 15%', value: 15 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/axe/gorehowl.png`,
    requiredMaterials: [
      { materialId: 'copper-ingot', quantity: 6 },
      { materialId: 'pine-plank', quantity: 3 }
    ],
    craftTime: 35
  }
];

export const T1_BOWS: WeaponComplete[] = [
  {
    id: 't1-bow-wraithbone',
    name: 'Wraithbone Bow',
    type: 'Bow',
    category: 'Ranged 2h',
    tier: 1,
    lore: 'Carved from bones of wraiths, its arrows seek the souls of the living.',
    stats: {
      damage: { base: 55, perTier: 11 },
      speed: { base: 80, perTier: 18 },
      combo: { base: 30, perTier: 12 },
      crit: { base: 6, perTier: 1 },
      block: { base: 2, perTier: 0.5 },
      defense: { base: 15, perTier: 4 }
    },
    abilities: {
      slot1: {
        name: 'Grudge Arrow',
        tooltip: 'Fire an arrow that marks the target with Grudge. Marked targets take 10% increased damage from your abilities. Range: 30m.',
        cooldown: 0,
        manaCost: 0,
        damage: '100% weapon damage',
        effect: 'Applies Grudge Mark (+10% damage taken)'
      },
      slot2: {
        name: 'Volley',
        tooltip: 'Fire a cone of 5 arrows in front of you, each dealing reduced damage. Excellent for hitting multiple targets.',
        cooldown: 8,
        manaCost: 15,
        damage: '60% weapon damage per arrow',
        effect: '5 arrows in cone, 15m range'
      },
      slot3: {
        name: 'Piercing Barrage',
        tooltip: 'Channel for 3 seconds, firing rapid arrows that pierce through all enemies in a line. Each hit increases damage by 5%.',
        cooldown: 18,
        manaCost: 35,
        damage: '40% weapon damage per hit, +5% stacking',
        effect: 'Channeled, piercing arrows'
      },
      slot4: {
        name: 'Phantom Arrows',
        tooltip: 'ULTIMATE: Fire 3 spectral arrows that home in on marked targets. Each arrow deals massive damage and passes through all enemies.',
        cooldown: 50,
        manaCost: 55,
        damage: '200% weapon damage per arrow',
        effect: 'Homing, piercing, prioritizes marked'
      }
    },
    passives: [
      { name: 'Precision', description: '+15% critical hit chance', value: 15 },
      { name: 'Speed Draw', description: '+20% attack speed', value: 20 },
      { name: 'Slow Venom', description: 'Marked targets are slowed by 20%', value: 20 }
    ],
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/bow/wraithbone-bow.png`,
    requiredMaterials: [
      { materialId: 'pine-plank', quantity: 5 },
      { materialId: 'string', quantity: 3 },
      { materialId: 'minor-essence', quantity: 1 }
    ],
    craftTime: 35
  }
];

export const T1_DAGGERS: WeaponComplete[] = [
  {
    id: 't1-dagger-nightfang',
    name: 'Nightfang',
    type: 'Dagger',
    category: '1h',
    tier: 1,
    lore: 'Fang of endless night grudges, striking silently from the shadows.',
    stats: {
      damage: { base: 45, perTier: 10 },
      speed: { base: 70, perTier: 15 },
      combo: { base: 20, perTier: 10 },
      crit: { base: 8, perTier: 1.2 },
      block: { base: 2, perTier: 0.5 },
      defense: { base: 12, perTier: 3 }
    },
    abilities: {
      slot1: {
        name: 'Shadow Stab',
        tooltip: 'A quick stab that builds Shadow Marks. Attacks from behind apply 2 marks. Maximum 5 marks per target.',
        cooldown: 0,
        manaCost: 0,
        damage: '90% weapon damage',
        effect: 'Applies 1-2 Shadow Marks (max 5)'
      },
      slot2: {
        name: 'Phantom Dash',
        tooltip: 'Dash 8m through shadows, dealing damage to all enemies in your path. Grants 2 seconds of invisibility after.',
        cooldown: 10,
        manaCost: 15,
        damage: '80% weapon damage',
        effect: 'Dash 8m, 2s invisibility'
      },
      slot3: {
        name: 'Poison Shiv',
        tooltip: 'Strike with a poisoned blade dealing damage over 8 seconds. Poison stacks up to 3 times.',
        cooldown: 12,
        manaCost: 18,
        damage: '60% weapon damage + 120% DoT over 8s',
        effect: 'Poison stacks to 3x'
      },
      slot4: {
        name: 'Deathgivers Fatal',
        tooltip: 'ULTIMATE: Execute a target with 5 Shadow Marks, dealing massive damage. Instantly kills targets below 15% HP.',
        cooldown: 45,
        manaCost: 50,
        damage: '300% weapon damage',
        effect: 'Execute targets <15% HP'
      }
    },
    passives: [
      { name: 'Life Leech', description: 'Heal for 4% of damage dealt', value: 4 },
      { name: 'Crit Chance', description: '+10% critical hit chance', value: 10 },
      { name: 'Venomous Wounds', description: 'Poisoned enemies are slowed by 25%', value: 25 }
    ],
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/dagger/nightfang.png`,
    requiredMaterials: [
      { materialId: 'copper-ingot', quantity: 4 },
      { materialId: 'pine-plank', quantity: 1 },
      { materialId: 'minor-essence', quantity: 1 }
    ],
    craftTime: 30
  }
];

export const T1_STAVES: WeaponComplete[] = [
  {
    id: 't1-staff-fire-emberwrath',
    name: 'Emberwrath Staff',
    type: 'Fire Staff',
    category: 'Ranged 2h',
    tier: 1,
    lore: 'Wrath of endless burning grudges, channeling flames of vengeance.',
    stats: {
      damage: { base: 65, perTier: 15 },
      speed: { base: 60, perTier: 12 },
      combo: { base: 100, perTier: 40 },
      crit: { base: 6, perTier: 1 },
      block: { base: 0, perTier: 0 },
      defense: { base: 10, perTier: 3 }
    },
    abilities: {
      slot1: {
        name: 'Fire Bolt',
        tooltip: 'Launch a bolt of fire at the target, building Burn stacks. Each stack deals 3% magic damage per second. Maximum 5 stacks.',
        cooldown: 0,
        manaCost: 5,
        damage: '100% magic damage',
        effect: 'Applies 1 Burn stack (3% dmg/s, max 5)'
      },
      slot2: {
        name: 'Flame Wave',
        tooltip: 'Send a wave of fire in a cone, dealing damage and applying 2 Burn stacks to all enemies hit.',
        cooldown: 10,
        manaCost: 25,
        damage: '120% magic damage',
        effect: 'Cone AoE, applies 2 Burn stacks'
      },
      slot3: {
        name: 'Inferno Shield',
        tooltip: 'Surround yourself with flames for 5 seconds. Absorb 30% of incoming damage and reflect 20% as fire damage.',
        cooldown: 20,
        manaCost: 35,
        effect: '30% absorb, 20% reflect for 5s'
      },
      slot4: {
        name: 'Flame Nova',
        tooltip: 'ULTIMATE: Explode all Burn stacks on nearby enemies, dealing 50% bonus damage per stack consumed. Applies maximum stacks to all enemies hit.',
        cooldown: 50,
        manaCost: 60,
        damage: '150% magic damage + 50% per Burn consumed',
        effect: 'Consume + reapply max Burns'
      }
    },
    passives: [
      { name: 'Burn Mastery', description: 'Burn damage increased by 30%', value: 30 },
      { name: 'Mana Regen', description: '+5 mana regeneration per second', value: 5 },
      { name: 'Crit Chance', description: '+8% critical hit chance on burning targets', value: 8 }
    ],
    craftedBy: 'Mystic',
    sprite: `${SPRITE_BASE}/staff/emberwrath-staff.png`,
    requiredMaterials: [
      { materialId: 'pine-plank', quantity: 4 },
      { materialId: 'minor-essence', quantity: 5 }
    ],
    craftTime: 40
  },
  {
    id: 't1-staff-frost-glacial',
    name: 'Glacial Spire Staff',
    type: 'Frost Staff',
    category: 'Ranged 2h',
    tier: 1,
    lore: 'Spire of glacial eternal grudges, freezing enemies in their tracks.',
    stats: {
      damage: { base: 60, perTier: 14 },
      speed: { base: 70, perTier: 15 },
      combo: { base: 90, perTier: 35 },
      crit: { base: 5, perTier: 0.8 },
      block: { base: 2, perTier: 0.5 },
      defense: { base: 12, perTier: 4 }
    },
    abilities: {
      slot1: {
        name: 'Frost Bolt',
        tooltip: 'Fire a bolt of ice, building Chill stacks. Each stack slows the target by 10%. At 5 stacks, target is frozen for 1.5 seconds.',
        cooldown: 0,
        manaCost: 5,
        damage: '100% magic damage',
        effect: 'Applies 1 Chill stack (10% slow, freeze at 5)'
      },
      slot2: {
        name: 'Ice Nova',
        tooltip: 'Release a nova of frost around you, dealing damage and slowing all enemies by 40% for 3 seconds.',
        cooldown: 12,
        manaCost: 25,
        damage: '110% magic damage AoE',
        effect: '40% slow for 3s, 8m radius'
      },
      slot3: {
        name: 'Glacial Shield',
        tooltip: 'Create an ice barrier that absorbs damage equal to 40% of your max mana. Enemies that attack the shield are chilled.',
        cooldown: 18,
        manaCost: 30,
        effect: 'Shield = 40% max mana, chills attackers'
      },
      slot4: {
        name: 'Absolute Zero',
        tooltip: 'ULTIMATE: Flash freeze all enemies in a large area for 3 seconds. Frozen enemies take 50% increased damage from all sources.',
        cooldown: 60,
        manaCost: 70,
        damage: '100% magic damage',
        effect: '3s freeze, +50% damage taken'
      }
    },
    passives: [
      { name: 'Chill Mastery', description: 'Slow effects increased by 25%', value: 25 },
      { name: 'Mana Regen', description: '+4 mana regeneration per second', value: 4 },
      { name: 'Frozen Heart', description: 'Frozen enemies take +20% crit damage', value: 20 }
    ],
    craftedBy: 'Mystic',
    sprite: `${SPRITE_BASE}/staff/glacial-spire-staff.png`,
    requiredMaterials: [
      { materialId: 'pine-plank', quantity: 4 },
      { materialId: 'minor-essence', quantity: 5 }
    ],
    craftTime: 40
  }
];

export const T1_CROSSBOWS: WeaponComplete[] = [
  {
    id: 't1-crossbow-ironveil',
    name: 'Ironveil Repeater',
    type: 'Crossbow',
    category: 'Ranged 2h',
    tier: 1,
    lore: 'Rapid fire from iron veils, delivering death with mechanical precision.',
    stats: {
      damage: { base: 65, perTier: 14 },
      speed: { base: 70, perTier: 15 },
      combo: { base: 20, perTier: 8 },
      crit: { base: 5, perTier: 0.8 },
      block: { base: 4, perTier: 1 },
      defense: { base: 20, perTier: 6 }
    },
    abilities: {
      slot1: {
        name: 'Heavy Bolt',
        tooltip: 'Fire a heavy bolt that builds Penetration stacks. Each stack ignores 5% of target armor. Maximum 4 stacks.',
        cooldown: 0,
        manaCost: 0,
        damage: '110% weapon damage',
        effect: 'Applies Penetration stack (-5% armor, max 4)'
      },
      slot2: {
        name: 'Knockback Bolt',
        tooltip: 'Fire a powerful bolt that knocks the target back 6m and stuns them for 0.5 seconds.',
        cooldown: 10,
        manaCost: 18,
        damage: '120% weapon damage',
        effect: '6m knockback, 0.5s stun'
      },
      slot3: {
        name: 'Trap Bolt',
        tooltip: 'Fire a bolt that deploys a trap on impact. Enemies stepping on the trap are rooted for 2 seconds.',
        cooldown: 15,
        manaCost: 22,
        damage: '80% weapon damage on deploy',
        effect: 'Creates trap, 2s root on trigger'
      },
      slot4: {
        name: 'Sweeping Bolt',
        tooltip: 'ULTIMATE: Fire a bolt charged with energy that pierces through all enemies in a line, dealing massive damage to each.',
        cooldown: 45,
        manaCost: 50,
        damage: '250% weapon damage',
        effect: 'Pierces all enemies in line, 40m range'
      }
    },
    passives: [
      { name: 'Penetration', description: 'Ignore 10% of target armor', value: 10 },
      { name: 'Power Shot', description: '+15% damage to single targets', value: 15 },
      { name: 'Slow Bolt', description: 'Heavy Bolt slows targets by 15%', value: 15 }
    ],
    craftedBy: 'Engineer',
    sprite: `${SPRITE_BASE}/crossbow/ironveil-repeater.png`,
    requiredMaterials: [
      { materialId: 'copper-ingot', quantity: 5 },
      { materialId: 'pine-plank', quantity: 4 },
      { materialId: 'string', quantity: 2 }
    ],
    craftTime: 40
  }
];

export const T1_GUNS: WeaponComplete[] = [
  {
    id: 't1-gun-blackpowder',
    name: 'Blackpowder Blaster',
    type: 'Gun',
    category: 'Ranged 2h',
    tier: 1,
    lore: 'Blasts with ancient blackpowder grudges, explosive and devastating.',
    stats: {
      damage: { base: 70, perTier: 16 },
      speed: { base: 60, perTier: 12 },
      combo: { base: 40, perTier: 18 },
      crit: { base: 7, perTier: 1.1 },
      block: { base: 2, perTier: 0.4 },
      defense: { base: 14, perTier: 4 }
    },
    abilities: {
      slot1: {
        name: 'Grudge Shot',
        tooltip: 'Fire a shot that builds Powder Marks. Each mark increases explosion damage by 20%. Maximum 3 marks.',
        cooldown: 0,
        manaCost: 0,
        damage: '120% weapon damage',
        effect: 'Applies Powder Mark (+20% explosion dmg, max 3)'
      },
      slot2: {
        name: 'Explosive Round',
        tooltip: 'Fire an explosive round that deals AoE damage on impact. Damage increased by 20% per Powder Mark.',
        cooldown: 12,
        manaCost: 25,
        damage: '100% weapon damage + 50% AoE',
        effect: '4m AoE, +20% per Powder Mark'
      },
      slot3: {
        name: 'Smoke Shot',
        tooltip: 'Fire a smoke grenade that blinds all enemies in the area for 3 seconds. Blinded enemies have 50% reduced accuracy.',
        cooldown: 18,
        manaCost: 20,
        effect: '3s blind, 50% accuracy reduction, 6m AoE'
      },
      slot4: {
        name: 'Demon Blast',
        tooltip: 'ULTIMATE: Unleash a devastating blast that consumes all Powder Marks, dealing massive damage and knocking back all enemies.',
        cooldown: 50,
        manaCost: 55,
        damage: '300% weapon damage + 100% per mark consumed',
        effect: 'Large knockback AoE, consumes marks'
      }
    },
    passives: [
      { name: 'Crit Shot', description: '+12% critical hit chance', value: 12 },
      { name: 'Powder Burn', description: 'Critical hits apply 3s burn DoT', value: 3 },
      { name: 'Reload Speed', description: '+15% attack speed', value: 15 }
    ],
    craftedBy: 'Engineer',
    sprite: `${SPRITE_BASE}/gun/blackpowder-blaster.png`,
    requiredMaterials: [
      { materialId: 'copper-ingot', quantity: 6 },
      { materialId: 'pine-plank', quantity: 3 },
      { materialId: 'gunpowder', quantity: 2 }
    ],
    craftTime: 45
  }
];

export const ALL_WEAPONS: WeaponComplete[] = [
  ...T0_WEAPONS,
  ...T1_SWORDS,
  ...T1_AXES,
  ...T1_BOWS,
  ...T1_DAGGERS,
  ...T1_STAVES,
  ...T1_CROSSBOWS,
  ...T1_GUNS
];

export function getWeaponSprite(weaponId: string): string | null {
  const weapon = ALL_WEAPONS.find(w => w.id === weaponId);
  return weapon?.sprite || null;
}

export function getWeaponsByTier(tier: number): WeaponComplete[] {
  return ALL_WEAPONS.filter(w => w.tier === tier);
}

export function getWeaponsByType(type: string): WeaponComplete[] {
  return ALL_WEAPONS.filter(w => w.type === type);
}

export function getWeaponsByCrafter(profession: string): WeaponComplete[] {
  return ALL_WEAPONS.filter(w => w.craftedBy === profession);
}
