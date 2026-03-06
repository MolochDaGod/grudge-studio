# GRUDGE Warlords - System Documentation

Complete documentation for the GRUDGE Warlords crafting and progression system.

## Quick Reference

| System | Levels | Description |
|--------|--------|-------------|
| **Heroes** | 0-20 | Player characters with 8 attributes, races, classes |
| **Classes** | — | Combat specializations (Guardian, Berserker, Mage, etc.) |
| **Professions** | 0-100 | Crafting specializations - all characters can use all professions |
| **Items** | T1-T8 | Tiered equipment and materials |

## Documentation Index

### Core Systems

- **[Hero Stats Guide](./hero-stats-guide.md)** - Complete 8-attribute system
  - Level 0-20 progression (20 starting + 7 per level = 160 max)
  - Attributes: Strength, Vitality, Endurance, Intellect, Wisdom, Dexterity, Agility, Tactics
  - Diminishing returns, stat caps, combat math

- **[Professions & Crafting Guide](./professions-crafting-guide.md)** - Crafting system
  - 5 professions: Miner, Forester, Mystic, Chef, Engineer
  - Level 0-100 progression with titles
  - Skill trees, activities, and recipes

- **[API Reference](./api-reference.md)** - Backend endpoints and data formats
  - Authentication routes
  - Character management
  - Inventory and crafting
  - Google Sheets sync

### Data Files

| File | Purpose |
|------|---------|
| `shared/statCalculator.ts` | Stat calculation engine, formulas, caps |
| `shared/schema.ts` | Database schemas (Drizzle ORM) |
| `client/src/lib/gameData.ts` | Client-side game data exports |
| `client/src/data/tieredCrafting.ts` | T1-T8 weapons, armor, materials |
| `client/src/data/professionTitles.ts` | Profession milestone titles |

### Configuration

| File | Purpose |
|------|---------|
| `replit.md` | Project overview and preferences |
| `puter/docs/` | Puter.com integration guides |
| `server/googleSheets.ts` | Google Sheets data sync |

## Key Concepts

### Two Progression Systems

**Hero System (0-20 levels)**
- Characters controlled by players
- Choose a **Class** at creation (Guardian, Paladin, Berserker, Assassin, Ranger, Mage, Warlock, Cleric, etc.)
- 8 attributes for combat stats
- Races for faction bonuses
- Equipment slots for gear

**Profession System (0-100 levels)**
- Crafting skill progression - **all characters can use all 5 professions**
- Skill trees unlock abilities
- Activities grant XP
- Titles at milestones (25/50/75/100)

### Tier System (T1-T8)

All craftable items use an 8-tier progression:

| Tier | Materials (Example) | Gold Cost | Success Rate |
|------|---------------------|-----------|--------------|
| T1 | Copper, Pine, Linen | 100 | 100% |
| T2 | Iron, Oak, Wool | 200 | 98% |
| T3 | Steel, Maple, Cotton | 400 | 95% |
| T4 | Mithril, Ash, Silk | 800 | 90% |
| T5 | Adamantine, Ironwood, Moonweave | 1,600 | 85% |
| T6 | Orichalcum, Ebony, Starweave | 3,200 | 80% |
| T7 | Starmetal, Wyrmwood, Voidweave | 6,400 | 75% |
| T8 | Divine, Worldtree, Divine Thread | 12,800 | 70% |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
├─────────────────────────────────────────────────────────────┤
│  pages/          │  domains/        │  data/                │
│  - Home          │  - professions/  │  - tieredCrafting.ts  │
│  - Character     │  - crafting/     │  - professionTitles.ts│
│  - Professions   │  - arsenal/      │  - weapons.ts         │
│                  │                  │  - equipment.ts       │
├─────────────────────────────────────────────────────────────┤
│                        SHARED                                │
│  schema.ts         │  statCalculator.ts                      │
│  (DB types)        │  (Combat math)                          │
├─────────────────────────────────────────────────────────────┤
│                        SERVER (Express)                      │
│  routes.ts      │  storage.ts    │  googleSheets.ts         │
│  (API endpoints)│  (DB queries)  │  (Data sync)             │
├─────────────────────────────────────────────────────────────┤
│                      PostgreSQL Database                     │
│  users, characters, inventory, crafted_items, skills...     │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### For Developers

1. Read `replit.md` for project context
2. Review `shared/schema.ts` for data models
3. Check `shared/statCalculator.ts` for combat formulas
4. Explore `client/src/data/` for game content

### For Designers

1. Item definitions: `client/src/data/tieredCrafting.ts`
2. Profession data: `client/src/data/{miner,forester,mystic,chef,engineer}.ts`
3. Stat formulas: `shared/statCalculator.ts` (ATTRIBUTE_DEFINITIONS)

## External Integrations

- **PostgreSQL** - Primary database (Drizzle ORM)
- **Google Sheets** - Live data sync for items, accounts
- **Puter.com** - Cloud deployment, KV storage, hosting
- **Replit Object Storage** - Game art assets
