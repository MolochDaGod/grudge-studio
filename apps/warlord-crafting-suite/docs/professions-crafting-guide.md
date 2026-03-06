# Professions & Crafting Guide

Complete reference for the GRUDGE Warlords profession and crafting system.

## Overview

Professions are crafting specializations that progress from level 0 to 100, separate from hero levels.

| Constant | Value |
|----------|-------|
| Level Range | 0-100 |
| Secret Title Level | 105 |
| Number of Professions | 5 |
| Tier Range | T1-T8 |

## The 5 Professions

| Profession | Icon | Role | Primary Crafts |
|------------|------|------|----------------|
| **Miner** | ⛏️ | Weaponsmith & Armorsmith | Swords, Axes, Hammers, Plate Armor |
| **Forester** | 🌲 | Leatherworker & Bowyer | Bows, Leather Armor, Ship Parts |
| **Mystic** | 🔮 | Enchanter & Clothier | Staves, Cloth Armor, Enchantments |
| **Chef** | 🍳 | Cook & Alchemist | Food, Potions, Buff Meals |
| **Engineer** | ⚙️ | Gunsmith & Inventor | Crossbows, Guns, Grenades, Siege |

## Profession Titles

Milestones earned through leveling:

| Level | Miner | Forester | Mystic | Chef | Engineer |
|-------|-------|----------|--------|------|----------|
| 25 | Prospector | Woodwalker | Acolyte | Apprentice Cook | Tinkerer |
| 50 | Tunnelwarden | Beastbinder | Spellweaver | Brewmaster | Siege Artisan |
| 75 | Forgemaster | Grovekeeper | Arcanist | Feast Warden | Automaton Crafter |
| 100 | Mountainbreaker | Wildshaper | Voidtouched | Grandmaster Alchemist | Grand Artificer |
| 105 | ??? (Secret) | ??? (Secret) | ??? (Secret) | ??? (Secret) | ??? (Secret) |

Secret titles require crafting specific legendary items:
- Miner: Craft the Divine Worldforge Hammer
- Forester: Craft the Worldtree Heartbow
- Mystic: Craft the Staff of Eternal Dawn
- Chef: Craft the Elixir of Immortality
- Engineer: Craft the Perpetual Engine

## Skill Trees

Each profession has a skill tree with branches:

### Miner Skill Tree

| Branch | Focus | Key Unlocks |
|--------|-------|-------------|
| **Core** | Fundamentals | Mining basics, smelting, metallurgy |
| **Weapons** (Left) | Weapon crafting | Swords, axes, daggers, hammers |
| **Gathering** (Middle) | Resource collection | Mining speed, ore quality, gems |
| **Armor** (Right) | Plate armor | Heavy armor, shields, accessories |

### Forester Skill Tree

| Branch | Focus | Key Unlocks |
|--------|-------|-------------|
| **Core** | Fundamentals | Woodcutting, leather processing |
| **Bows** (Left) | Ranged weapons | All bow types, quivers |
| **Gathering** (Middle) | Resource collection | Wood/leather quality, rare finds |
| **Leather** (Right) | Leather armor | Medium armor, cloaks |

### Mystic Skill Tree

| Branch | Focus | Key Unlocks |
|--------|-------|-------------|
| **Core** | Fundamentals | Essence gathering, weaving |
| **Staves** (Left) | Magical weapons | All staff types by element |
| **Gathering** (Middle) | Magical resources | Essence quality, gem cutting |
| **Cloth** (Right) | Cloth armor | Robes, enchanted accessories |

### Chef Skill Tree

| Branch | Focus | Key Unlocks |
|--------|-------|-------------|
| **Core** | Fundamentals | Ingredient gathering, cooking |
| **Potions** (Left) | Alchemy | Health/mana pots, elixirs |
| **Gathering** (Middle) | Ingredients | Herbs, fishing, rare finds |
| **Food** (Right) | Cooking | Buff meals, feast preparation |

### Engineer Skill Tree

| Branch | Focus | Key Unlocks |
|--------|-------|-------------|
| **Core** | Fundamentals | Salvaging, basic crafts |
| **Weapons** (Left) | Ranged/explosive | Crossbows, guns, grenades |
| **Gathering** (Middle) | Components | Salvage quality, blueprints |
| **Siege** (Right) | War machines | Catapults, ballistas, vehicles |

## Skill Node Types

| Type | Icon | Purpose |
|------|------|---------|
| `stat` | 📊 | Passive bonuses (success chance, quality) |
| `recipe` | 📜 | Unlocks new crafting recipes |
| `effect` | ✨ | Special effects (speed, double yield) |
| `combat` | ⚔️ | Combat-related bonuses |

## Activities & XP

Activities grant profession XP. XP is multiplied by tier for tier-scaled activities.

### Activity Types

| Type | Color | Description |
|------|-------|-------------|
| `harvest` | 🟢 Green | Gathering raw materials |
| `craft` | 🟡 Amber | Creating items |
| `mission` | 🔵 Blue | Quest-based objectives |
| `supply` | 🟣 Purple | Faction contribution |
| `event` | 🔴 Pink | Special events |
| `combat` | 🔴 Red | Combat activities |
| `discovery` | 🔵 Cyan | Finding rare resources |

### XP Multiplier Formula

For activities with `tierMultiplier: true`:
```
Actual XP = Base XP × Tier
```

Example: Mining T5 ore (base 15 XP) = 15 × 5 = 75 XP

### Sample Activities (Miner)

| Activity | Type | Base XP | Tier Scaled |
|----------|------|---------|-------------|
| Mine Ore Node | Harvest | 15 | Yes |
| Extract Gems | Harvest | 25 | Yes |
| Rare Vein Discovery | Discovery | 100 | Yes |
| Smelt Ingots | Craft | 20 | Yes |
| Forge Swords | Craft | 50 | Yes |
| Ore Supply Mission | Mission | 150 | No |
| Mining Rush Event | Event | 500 | No |
| Legendary Forge Quest | Mission | 1000 | No |

## Tier System (T1-T8)

All craftable items and materials follow an 8-tier progression.

### Tier Materials

| Tier | Ore → Ingot | Wood → Plank | Cloth → Fabric | Leather |
|------|-------------|--------------|----------------|---------|
| T1 | Copper | Pine | Linen | Rawhide |
| T2 | Iron | Oak | Wool | Thick Hide |
| T3 | Steel | Maple | Cotton | Rugged Leather |
| T4 | Mithril | Ash | Silk | Hardened Leather |
| T5 | Adamantine | Ironwood | Moonweave | Wyrm Leather |
| T6 | Orichalcum | Ebony | Starweave | Infernal Leather |
| T7 | Starmetal | Wyrmwood | Voidweave | Titan Leather |
| T8 | Divine | Worldtree | Divine Thread | Divine Leather |

### Tier Costs & Success Rates

| Tier | Gold Cost | Crafting Time | Success Rate | Base Materials |
|------|-----------|---------------|--------------|----------------|
| T1 | 100 | 3s | 100% | 2 |
| T2 | 200 | 4s | 98% | 3 |
| T3 | 400 | 5s | 95% | 4 |
| T4 | 800 | 7s | 90% | 5 |
| T5 | 1,600 | 10s | 85% | 6 |
| T6 | 3,200 | 14s | 80% | 8 |
| T7 | 6,400 | 18s | 75% | 10 |
| T8 | 12,800 | 25s | 70% | 12 |

### Price Multipliers

Used for shop buy/sell pricing:

| Tier | Multiplier |
|------|------------|
| T1 | 1× |
| T2 | 2.5× |
| T3 | 5× |
| T4 | 10× |
| T5 | 20× |
| T6 | 40× |
| T7 | 80× |
| T8 | 160× |

Sell price = 30% of buy price.

## Crafting Bonuses

Skill nodes provide these bonus types:

| Bonus Type | Effect |
|------------|--------|
| `successChance` | +X% chance to craft successfully |
| `qualityBoost` | +X% item quality |
| `speedBoost` | +X% crafting/gathering speed |
| `doubleYield` | +X% chance for double output |
| `materialReduction` | -X% materials required |
| `enchantPower` | +X% enchantment strength |
| `tierUnlock` | Unlocks crafting tier X |

## Weapon Sets by Profession

### Miner (Metalwork)
- Swords (6 variants): Bloodfeud Blade, Wraithfang, Oathbreaker, Kinrend, Dusksinger, Emberclad
- 1H Axes (6): Gorehowl, Skullsplitter, Veinreaver, Ironmaw, Dreadcleaver, Bonehew
- Daggers (4+2 shared): Bloodshiv, Wraithclaw, Emberfang, Ironspike + shared with Forester
- 1H Hammers (6): Grudgehammer, Oathcrusher, Bloodmaul, Ironbreak, Wrathpound, Emberpound
- 2H Hammers (6): Titanmaul, Doomhammer, Wrathquake, Bloodpound, Ironcrush, Embershatter
- Greatswords (6): Doomspire, Bloodspire, Wraithblade, Emberbrand, Ironedge, Duskbringer
- Greataxes (6): Skullsunder, Bloodreaver, Wraithhew, Embermaul, Ironrend, Dusksplitter

### Forester (Woodwork/Leather)
- Bows (6): Wraithbone, Bloodstring, Shadowflight, Emberthorn, Ironvine, Duskreaver
- Spears (6): Iron Pike, Steel Lance, Mithril Javelin, Bloodspear, Voidpiercer, Divine Trident
- Maces (6): Iron Cudgel, Steel Flail, Spiked Morningstar, Bloodbludgeon, Obsidian Crusher, Divine Scepter

### Mystic (Enchanting)
- Nature Staves (6): Verdant Wrath, Thorn Grudge, Wild Oathbreaker, Grove Guardian, Blossom Fury, Root Warden
- Fire Staves (6): Emberwrath, Sunfire, Inferno Spire, Ash Grudge, Ember Heart, Blazing Wrath
- Frost Staves (6): Glacial Spire, Frostbite, Winter Grudge, Ice Warden, Blizzard Heart, Frozen Spite
- Holy Staves (6): Dawnspire, Redemption, Sacred Light, Holy Wrath, Celestial Grace, Divine Judgment
- Lightning Staves (5+1): Stormwrath, Tempest Spire, Shock Grudge, Voltaic Heart, Thunder Spire + Thunder Grudge
- Arcane Staves (6): Voidspire, Arcane Fury, Mystic Grudge, Ether Heart, Void Warden, Chaos Spire

### Engineer (Mechanical)
- Crossbows (6): Ironveil Repeater, Skullpiercer, Bloodreaver, Wraithspike, Emberbolt, Ironshard
- Guns (6): Blackpowder Blaster, Ironstorm Gun, Bloodcannon, Wraithbarrel, Emberrifle, Duskblaster

## Armor Sets

| Set Name | Lore | Set Bonus |
|----------|------|-----------|
| Bloodfeud | Blood of clan feuds | Arcane Ward: +20% magic resist |
| Wraithfang | Wraith echo in shadows | Wraith Echo: 10% dodge chance |
| Oathbreaker | Broken oaths empower | Broken Oath: Purge 1 buff on hit |
| Kinrend | Kinship bonds protect | Family Guard: +15% heal received |
| Dusksinger | Twilight speed grants | Evening Veil: +10% move speed |
| Emberclad | Flames protect bearer | Flame Cloak: Burn attackers |

Armor slots: Helm, Shoulder, Chest, Hands, Feet, Ring, Necklace, Relic

## Consumables

### Engineer Consumables
- **Bandages**: Health, Poison, Freeze cures + mobility buff
- **Grenades**: Explosive, Frost, Blackhole, Bounce, Heal Bomb
- **Fishing Lures**: Basic, Shiny, Magic (fish catch bonuses)
- **Scopes**: Iron, Precision, Sniper, Master (accuracy/crit)
- **Traps**: Bear, Spike, Net
- **Siege**: Catapult, Ballista, Cannon, Flying Machine

## Code Reference

**Source Files:**
- `client/src/data/miner.ts` - Miner skill tree
- `client/src/data/forester.ts` - Forester skill tree
- `client/src/data/mystic.ts` - Mystic skill tree
- `client/src/data/chef.ts` - Chef skill tree
- `client/src/data/engineer.ts` - Engineer skill tree
- `client/src/data/tieredCrafting.ts` - Tier definitions, weapons, armor
- `client/src/data/professionTitles.ts` - Title milestones
- `client/src/data/professionActivities.ts` - XP activities

**Key Exports:**
```typescript
// Profession data
import { minerData, foresterData, mysticData, chefData, engineerData } from '@/domains/professions';

// Titles
import { professionTitles, getTitleForLevel, getNextTitle } from '@/domains/professions';

// Activities
import { professionActivities, calculateXpWithTier, ACTIVITY_TYPE_LABELS } from '@/domains/professions';

// Tiers
import { TIERS, TIER_LABELS, TIER_MATERIALS, TIER_COSTS, WEAPON_SETS, ARMOR_SETS } from '@/data/tieredCrafting';
```
