# Hero Stats & Attributes Guide

Complete reference for the GRUDGE Warlords hero character system.

## Overview

Heroes are player characters that progress from level 0 to 20 using an 8-attribute system.

| Constant | Value |
|----------|-------|
| Level Range | 0-20 |
| Starting Attribute Points | 20 |
| Points Per Level | 7 |
| Max Points (Level 20) | 160 |

## Attribute Point Progression

| Level | Points Gained | Total Points | Example Distribution |
|-------|---------------|--------------|----------------------|
| 0 | 20 (starting) | 20 | Tank: 10 STR, 5 VIT, 5 END |
| 5 | +35 | 55 | Tank: 25 STR, 15 VIT, 15 END |
| 10 | +70 | 90 | Tank: 35 STR, 30 VIT, 25 END |
| 15 | +105 | 125 | Tank: 50 STR, 40 VIT, 35 END |
| 20 | +140 | 160 | Tank: 60 STR, 50 VIT, 50 END |

## The 8 Attributes

### Strength 💪
**Role:** Tank / Melee DPS  
**Focus:** High health, damage, and defense with strong combat modifiers

| Stat | Flat Bonus | % Bonus |
|------|------------|---------|
| Health | +26 | +0.8% |
| Damage | +3 | +2.0% |
| Defense | +12 | +1.5% |
| Block Chance | +0.5% | +5.0% |
| Block Factor | +0.85% | +26.3% |
| Critical Chance | +0.32% | +7.0% |
| Critical Factor | +1.1% | +1.5% |

### Vitality ❤️
**Role:** Tank / Survivability  
**Focus:** Maximum health, defense, and damage mitigation

| Stat | Flat Bonus | % Bonus |
|------|------------|---------|
| Health | +25 | +0.5% |
| Mana | +2 | +0.2% |
| Stamina | +5 | +0.1% |
| Damage | +2 | +0.1% |
| Defense | +12 | — |
| Block Factor | +0.3% | +17.0% |
| Resistance | +0.5% | — |

### Endurance 🛡️
**Role:** Defensive Specialist  
**Focus:** Defense, block mechanics, and critical evasion

| Stat | Flat Bonus | % Bonus |
|------|------------|---------|
| Health | +10 | +0.1% |
| Stamina | +1 | +0.3% |
| Defense | +12 | +12.0% |
| Block Chance | +0.11% | +73.5% |
| Block Factor | +0.27% | — |
| Resistance | +0.46% | — |

### Intellect 🧠
**Role:** Mage / Caster  
**Focus:** Mana, magic damage, and spell accuracy

| Stat | Flat Bonus | % Bonus |
|------|------------|---------|
| Mana | +5 | +5.0% |
| Damage | +4 | +2.5% |
| Defense | +2 | — |
| Critical Chance | +0.23% | +0.1% |
| Accuracy | +0.12% | +33.8% |
| Resistance | +0.38% | +17.0% |

### Wisdom 🔮
**Role:** Healer / Support  
**Focus:** Mana efficiency, survivability, and spell effectiveness

| Stat | Flat Bonus | % Bonus |
|------|------------|---------|
| Health | +10 | — |
| Mana | +20 | +3.0% |
| Damage | +2 | +1.5% |
| Defense | +2 | — |
| Critical Chance | +0.5% | +0.15% |
| Resistance | +0.5% | — |

### Dexterity 🎯
**Role:** Rogue / Precision Fighter  
**Focus:** Critical strikes, accuracy, and evasion

| Stat | Flat Bonus | % Bonus |
|------|------------|---------|
| Damage | +3 | +1.8% |
| Defense | +10 | +1.0% |
| Block Chance | +0.41% | +1.0% |
| Critical Chance | +0.5% | +1.2% |
| Accuracy | +0.7% | +1.5% |

### Agility ⚡
**Role:** Mobile DPS / Dodge Tank  
**Focus:** Mobility, critical strikes, and defensive penetration

| Stat | Flat Bonus | % Bonus |
|------|------------|---------|
| Health | +2 | +0.6% |
| Stamina | +5 | +0.5% |
| Damage | +3 | +1.6% |
| Defense | +5 | +0.8% |
| Critical Chance | +0.42% | +1.0% |

### Tactics 🎲
**Role:** Strategic Fighter / Commander  
**Focus:** Balanced combat stats with penetration abilities

| Stat | Flat Bonus | % Bonus |
|------|------------|---------|
| Health | +10 | +8.4% |
| Mana | — | +8.2% |
| Stamina | +1 | — |
| Damage | +3 | +0.2% |
| Defense | +5 | +0.5% |
| Block Chance | +0.27% | +0.8% |

## Base Stats

These are fixed values, not scaled by level:

| Stat | Base Value |
|------|------------|
| Health | 100 |
| Mana | 50 |
| Stamina | 100 |
| Damage | 10 + Level |
| Defense | 10 |

## Calculation Formula

```
Attribute Bonus = (Flat × Effective Points) + (Base × Percent × Effective Points)
Total Stat = Base + Σ(Attribute Bonuses) + Equipment + Traits + Sets
```

### Health Example
Level 10, 35 Strength, 30 Vitality:

```
Base Health: 100
Strength Effective: 30 (35 raw → 30 after DR)
Vitality Effective: 27.5 (30 raw → 27.5 after DR)

Strength: (26 × 30) + (100 × 0.008 × 30) = 780 + 24 = 804
Vitality: (25 × 27.5) + (100 × 0.005 × 27.5) = 687.5 + 13.75 = 701.25

Total: 100 + 804 + 701.25 = 1,605 HP
```

### Mana Example
Level 10, 40 Intellect, 40 Wisdom:

```
Base Mana: 50
Intellect Effective: 32.5 (40 raw → 32.5 after DR)
Wisdom Effective: 32.5 (40 raw → 32.5 after DR)

Intellect: (5 × 32.5) + (50 × 0.05 × 32.5) = 162.5 + 81.25 = 243.75
Wisdom: (20 × 32.5) + (50 × 0.03 × 32.5) = 650 + 48.75 = 698.75

Total: 50 + 243.75 + 698.75 = 992.5 Mana
```

## Diminishing Returns

Points beyond 25 in a single attribute become less effective:

| Point Range | Efficiency | Example |
|-------------|------------|---------|
| 1-25 | 100% | 25 points → 25 effective |
| 26-50 | 50% | 50 points → 37.5 effective |
| 51+ | 25% | 60 points → 42.5 effective |

**Formula:**
```
Effective = min(25, raw) 
          + max(0, min(25, raw - 25)) × 0.5 
          + max(0, raw - 50) × 0.25
```

**Examples:**
- 35 points → 25 + (10 × 0.5) = 30 effective
- 60 points → 25 + (25 × 0.5) + (10 × 0.25) = 40 effective
- 160 points → 25 + (25 × 0.5) + (110 × 0.25) = 65 effective

## Stat Caps

Combat factors have maximum values:

| Stat | Cap |
|------|-----|
| Block Chance | 75% |
| Block Factor | 90% |
| Critical Chance | 75% |
| Critical Factor | 3.0× (300%) |
| Accuracy | 95% |
| Resistance | 95% |
| Drain Health | 50% |
| Drain Mana | 50% |
| Reflect Factor | 50% |
| Absorb Health | 50% |
| Absorb Mana | 50% |

## Combat Math

### Defense Mitigation (Relational Damage)

```
Damage Taken = Incoming Damage × (100 - √Defense) / 100
```

| Defense | √Defense | Reduction | 100 Damage → |
|---------|----------|-----------|--------------|
| 100 | 10 | 10% | 90 |
| 225 | 15 | 15% | 85 |
| 400 | 20 | 20% | 80 |
| 625 | 25 | 25% | 75 |
| 900 | 30 | 30% | 70 |
| 1,225 | 35 | 35% | 65 |
| 1,600 | 40 | 40% | 60 |

### Block Mechanics

```
IF Random(0, 1) < Block Chance:
    Damage = Damage × (1 - Block Factor)
```

- Block Chance capped at 75%
- Block Factor capped at 90%
- Example: 40% block, 0.35 factor → 65 damage on block

### Critical Hit Mechanics

```
IF Random(0, 1) < Critical Chance:
    Damage = Damage × Critical Factor
```

- Critical Chance capped at 75%
- Critical Factor capped at 3.0×
- Critical cannot occur on blocked attacks

### Complete Damage Pipeline (8 Steps)

1. **Calculate Base Damage** - Level + Attributes + Equipment + Traits
2. **Apply Defense Break** - Reduce target defense by attacker's Break Factor
3. **Calculate Mitigation** - Apply defense formula
4. **Apply Random Variance** - ±25% deviation (optional)
5. **Check Block** - Roll vs effective block chance
6. **Check Critical** - Roll vs effective crit chance (if not blocked)
7. **Apply Damage** - Subtract from target HP
8. **Trigger Effects** - Drain, Reflect, Absorb factors activate

## Level 20 Build Examples

### Pure Tank (60 STR / 50 VIT / 50 END)
- Health: ~2,200
- Defense: ~1,500 (38.7% reduction)
- Block Chance: ~70%
- Block Factor: ~0.75
- Damage: ~140

### Physical DPS (50 STR / 55 DEX / 55 AGI)
- Health: ~850
- Damage: ~155
- Critical Chance: 75% (capped)
- Critical Factor: ~2.1×
- Accuracy: ~60%

### Magic DPS (80 INT / 80 WIS)
- Mana: ~1,300
- Damage: ~215
- Accuracy: ~70%
- Resistance: ~40%

### Balanced Hybrid (40 STR / 40 DEX / 40 AGI / 40 TAC)
- Moderate stats across all categories
- Versatile but not specialized

## Code Reference

**Source File:** `shared/statCalculator.ts`

Key exports:
- `LEVEL_PROGRESSION` - Level constants
- `ATTRIBUTE_DEFINITIONS` - All bonus values
- `STAT_CAPS` - Maximum values
- `DIMINISHING_RETURNS` - DR configuration
- `calculateDerivedStats()` - Main calculation function
- `applyDiminishingReturns()` - DR helper
- `getTotalPointsForLevel()` - Points for a level
- `calculateCombatDamage()` - Full combat pipeline
