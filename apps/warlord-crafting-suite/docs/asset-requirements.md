# GRUDGE Warlords - Asset Requirements

## Summary

| Category | Complete | Missing | Total |
|----------|----------|---------|-------|
| **Materials (ores, wood, cloth, etc.)** | 89 | 35 | 124 |
| **Weapons** | 80 | 30 | 110 |
| **Armor (all slots x all tiers x 3 types)** | 0 | 144 | 144 |
| **Accessories (rings, necklaces, backs)** | 0 | 24 | 24 |
| **Tier 0 Items** | 0 | 23 | 23 |
| **Crafting Components** | 8 | 23 | 31 |
| **TOTAL** | 177 | 279 | 456 |

---

## Tier 0 Items (23 total)

Entry-level broken/crude equipment for new characters:

### T0 Weapons (14)
| ID | Name | Type |
|----|------|------|
| t0-sword | Broken Blade | 1H Sword |
| t0-axe | Chipped Hatchet | 1H Axe |
| t0-dagger | Rusty Shiv | Dagger |
| t0-hammer | Cracked Mallet | 1H Hammer |
| t0-greatsword | Shattered Claymore | 2H Greatsword |
| t0-greataxe | Splintered Broadaxe | 2H Greataxe |
| t0-greathammer | Ruined Maul | 2H Hammer |
| t0-bow | Warped Bow | Bow |
| t0-crossbow | Jammed Crossbow | Crossbow |
| t0-gun | Broken Pistol | Gun |
| t0-staff | Cracked Rod | Staff |
| t0-tome | Faded Tome | Tome |
| t0-shield | Dented Buckler | Shield |
| t0-focus | Dim Orb | Focus |

### T0 Armor (6)
| ID | Name | Slot |
|----|------|------|
| t0-head | Tattered Cap | Head |
| t0-chest | Worn Tunic | Chest |
| t0-legs | Patched Trousers | Legs |
| t0-feet | Scuffed Boots | Feet |
| t0-hands | Frayed Gloves | Hands |
| t0-shoulders | Ragged Shawl | Shoulders |

### T0 Accessories (3)
| ID | Name | Slot |
|----|------|------|
| t0-ring | Bent Ring | Ring |
| t0-necklace | Frayed Cord | Necklace |
| t0-back | Tattered Cloak | Back |

### T0 Materials (5)
| ID | Name | Type |
|----|------|------|
| scrap-metal | Scrap Metal | T0 Ingot |
| rotted-wood | Rotted Wood | T0 Plank |
| torn-rag | Torn Rag | T0 Cloth |
| scraps | Scraps | T0 Leather |
| pebble | Pebble | T0 Gem |

---

## Crafting Components for T1 (23 new)

These are needed to craft T1 equipment from T0 base items:

### Weapon Components (14)
| ID | Name | Used For |
|----|------|----------|
| blade-core | Blade Core | Swords |
| axe-head | Axe Head | Axes |
| knife-blade | Knife Blade | Daggers |
| hammer-head | Hammer Head | Hammers |
| great-blade | Great Blade | Greatswords |
| great-head | Great Head | Greataxes |
| great-maul | Great Maul | Greathammers |
| bow-limb | Bow Limb | Bows |
| crossbow-frame | Crossbow Frame | Crossbows |
| gun-barrel | Gun Barrel | Guns |
| staff-core | Staff Core | Staffs |
| tome-binding | Tome Binding | Tomes |
| shield-frame | Shield Frame | Shields |
| focus-lens | Focus Lens | Foci |

### Armor Components (6)
| ID | Name | Used For |
|----|------|----------|
| helm-frame | Helm Frame | Head armor |
| chest-plate | Chest Plate | Chest armor |
| leg-guards | Leg Guards | Leg armor |
| boot-sole | Boot Sole | Feet armor |
| glove-lining | Glove Lining | Hand armor |
| pauldron-base | Pauldron Base | Shoulder armor |

### Accessory Components (3)
| ID | Name | Used For |
|----|------|----------|
| ring-setting | Ring Setting | Rings |
| chain-link | Chain Link | Necklaces |
| cape-clasp | Cape Clasp | Capes/Backs |

---

## Missing Weapons (30 total)

### Shields (8 - T1-T8)
All 8 tiers of shields need sprites.

### Focus/Orbs (8 - T1-T8)
All 8 tiers of magical focus items need sprites.

---

## Armor Sprites Needed (144 total)

**Formula:** 8 tiers × 6 slots × 3 armor types = 144 sprites

### Armor Types
- **Plate** (heavy - Warriors) - Metal helmets, breastplates, gauntlets
- **Leather** (medium - Rangers) - Hoods, vests, gloves
- **Cloth** (light - Mages) - Circlets, robes, wraps

### Armor Slots (6 per type)
- Head (helm/hood/circlet)
- Chest (breastplate/vest/robe)
- Legs (greaves/pants/skirt)
- Feet (boots/shoes/sandals)
- Hands (gauntlets/gloves/wraps)
- Shoulders (pauldrons/mantle/cape)

---

## Accessories Sprites Needed (24 total)

**Formula:** 8 tiers × 3 types = 24 sprites

| Type | Count | Examples |
|------|-------|----------|
| Rings | 8 | Copper Ring → Divine Ring |
| Necklaces | 8 | Copper Necklace → Divine Necklace |
| Backs | 8 | Copper Cloak → Divine Cloak |

---

## Missing Materials (35 total)

### Leather T5-T8 (4)
- Wyrm Leather
- Infernal Leather
- Titan Leather
- Divine Leather

### Infusions (8)
- Fire, Frost, Lightning, Nature, Holy, Shadow, Arcane, Divine

### Meat T2-T8 (7)
- Quality Meat through Divine Meat

### Fish T2-T8 (7)
- River Fish through Divine Fish

### Basic Ingredients (4)
- Vegetable, Grain, Flour, Honey

### Rare Ingredients (5)
- Rare Spice, Mystic Spice, Dragon Pepper, Celestial Herb, Divine Nectar

---

## Crafting Flow: T0 → T1

```
T0 Broken Item + Component + T1 Materials = T1 Crafted Item

Example (Copper Sword):
  Broken Blade (T0) + Blade Core + 2x Copper Ingot + 1x Pine Plank = Copper Sword (T1)
```

---

## File Organization

```
client/public/2dassets/sprites/
├── ore/           ✅ Complete (8)
├── wood/          ✅ Complete (8)
├── plank/         ✅ Complete (8)
├── leather/       ⚠️ Partial (4/8)
├── cloth/         ✅ Complete (8)
├── thread/        ✅ Complete (8)
├── essence/       ✅ Complete (8)
├── gem/           ✅ Complete (8)
├── gear/          ✅ Complete (8)
├── component/     ⚠️ Partial (16/39)
├── ingredient/    ⚠️ Partial (6/17)
├── infusion/      ❌ Missing (0/8)
├── sword/         ✅ Complete (8)
├── axe/           ✅ Complete (8)
├── dagger/        ✅ Complete (6)
├── hammer/        ✅ Complete (12)
├── greatsword/    ✅ Complete (6)
├── greataxe/      ✅ Complete (6)
├── bow/           ✅ Complete (6)
├── crossbow/      ✅ Complete (6)
├── gun/           ✅ Complete (6)
├── staff/         ✅ Complete (12)
├── tome/          ✅ Complete (6)
├── shield/        ❌ Missing (0/8)
├── focus/         ❌ Missing (0/8)
├── armor/
│   ├── plate/     ❌ Missing (0/48)
│   ├── leather/   ❌ Missing (0/48)
│   └── cloth/     ❌ Missing (0/48)
├── accessory/
│   ├── ring/      ❌ Missing (0/8)
│   ├── necklace/  ❌ Missing (0/8)
│   └── back/      ❌ Missing (0/8)
└── t0/            ❌ Missing (0/28)
```

---

## Priority Order for Generation

1. **T0 Items** (28 sprites) - Critical for new player experience
2. **Crafting Components** (23 sprites) - Needed for T1 crafting flow
3. **Missing Materials** (35 sprites) - Complete the material system
4. **Shields & Focus** (16 sprites) - Complete weapon types
5. **Accessories** (24 sprites) - Add jewelry/back slot items
6. **Armor** (144 sprites) - Largest batch, can be done in phases
