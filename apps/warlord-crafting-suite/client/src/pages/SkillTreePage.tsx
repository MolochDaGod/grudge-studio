import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Sword, Search, Sparkles, Target, ChevronRight,
  Axe, Hammer, Crosshair, Flame, Snowflake, Sun, Zap, Leaf, BookOpen,
  Radius, Cylinder,
} from "lucide-react";
import { getWeaponsByType, type Weapon } from "@/data/weapons";

// Sprite icons per weapon type — one representative sprite per type
import swordSprite from "@assets/generated_images/bloodspire_greatsword_sprite.png";
import axeSprite from "@assets/generated_images/skullsunder_greataxe_sprite.png";
import daggerSprite from "@assets/generated_images/bloodshiv_dagger_sprite.png";
import hammer1hSprite from "@assets/generated_images/ironfist_hammer_sprite.png";
import greatswordSprite from "@assets/generated_images/doomspire_greatsword_sprite.png";
import greataxeSprite from "@assets/generated_images/bloodreaver_greataxe_sprite.png";
import hammer2hSprite from "@assets/generated_images/titanmaul_2h_hammer_sprite.png";
import bowSprite from "@assets/generated_images/emberthorn_bow_sprite.png";
import crossbowSprite from "@assets/generated_images/ironveil_crossbow_sprite.png";
import gunSprite from "@assets/generated_images/blackpowder_pistol_sprite.png";
import fireStaffSprite from "@assets/generated_images/emberwrath_fire_staff_sprite.png";
import frostStaffSprite from "@assets/generated_images/glacial_spire_frost_staff_sprite.png";
import natureStaffSprite from "@assets/generated_images/nature_tome_sprite.png";
import holyStaffSprite from "@assets/generated_images/holy_tome_sprite.png";
import arcaneStaffSprite from "@assets/generated_images/arcane_tome_sprite.png";
import lightningStaffSprite from "@assets/generated_images/lightning_tome_sprite.png";
import fireTomeSprite from "@assets/generated_images/fire_tome_magic_book_sprite.png";
import frostTomeSprite from "@assets/generated_images/frost_tome_magic_book_sprite.png";
import natureTomeSprite from "@assets/generated_images/nature_tome_magic_sprite.png";
import holyTomeSprite from "@assets/generated_images/holy_tome_magic_sprite.png";
import arcaneTomeSprite from "@assets/generated_images/arcane_tome_magic_sprite.png";
import lightningTomeSprite from "@assets/generated_images/lightning_tome_sprite.png";

const WEAPON_TYPE_SPRITES: Record<string, string> = {
  Sword: swordSprite,
  Axe: axeSprite,
  Dagger: daggerSprite,
  Hammer1h: hammer1hSprite,
  Greatsword: greatswordSprite,
  Greataxe: greataxeSprite,
  Hammer2h: hammer2hSprite,
  Bow: bowSprite,
  Crossbow: crossbowSprite,
  Gun: gunSprite,
  "Fire Staff": fireStaffSprite,
  "Frost Staff": frostStaffSprite,
  "Nature Staff": natureStaffSprite,
  "Holy Staff": holyStaffSprite,
  "Arcane Staff": arcaneStaffSprite,
  "Lightning Staff": lightningStaffSprite,
  "Fire Tome": fireTomeSprite,
  "Frost Tome": frostTomeSprite,
  "Nature Tome": natureTomeSprite,
  "Holy Tome": holyTomeSprite,
  "Arcane Tome": arcaneTomeSprite,
  "Lightning Tome": lightningTomeSprite,
};

const WEAPON_FALLBACK_ICON: Record<string, any> = {
  Sword: Sword,
  Axe: Axe,
  Dagger: Sword,
  Hammer1h: Hammer,
  Hammer2h: Hammer,
  Greatsword: Sword,
  Greataxe: Axe,
  Bow: Radius,
  Crossbow: Crosshair,
  Gun: Cylinder,
  "Fire Staff": Flame,
  "Frost Staff": Snowflake,
  "Nature Staff": Leaf,
  "Holy Staff": Sun,
  "Arcane Staff": Sparkles,
  "Lightning Staff": Zap,
  "Fire Tome": BookOpen,
  "Frost Tome": BookOpen,
  "Nature Tome": BookOpen,
  "Holy Tome": BookOpen,
  "Arcane Tome": BookOpen,
  "Lightning Tome": BookOpen,
};

const WEAPON_GLOW: Record<string, string> = {
  Sword: "hsl(190, 80%, 50%)",
  Axe: "hsl(0, 70%, 50%)",
  Dagger: "hsl(142, 70%, 45%)",
  Hammer1h: "hsl(220, 20%, 60%)",
  Hammer2h: "hsl(220, 20%, 60%)",
  Greatsword: "hsl(190, 80%, 50%)",
  Greataxe: "hsl(0, 70%, 50%)",
  Bow: "hsl(43, 85%, 55%)",
  Crossbow: "hsl(43, 85%, 55%)",
  Gun: "hsl(24, 94%, 50%)",
  "Fire Staff": "hsl(24, 94%, 50%)",
  "Frost Staff": "hsl(210, 80%, 60%)",
  "Nature Staff": "hsl(142, 71%, 45%)",
  "Holy Staff": "hsl(50, 90%, 60%)",
  "Arcane Staff": "hsl(271, 91%, 65%)",
  "Lightning Staff": "hsl(50, 90%, 60%)",
  "Fire Tome": "hsl(24, 94%, 50%)",
  "Frost Tome": "hsl(210, 80%, 60%)",
  "Nature Tome": "hsl(142, 71%, 45%)",
  "Holy Tome": "hsl(50, 90%, 60%)",
  "Arcane Tome": "hsl(271, 91%, 65%)",
  "Lightning Tome": "hsl(50, 90%, 60%)",
};

type WeaponCategory = "Melee 1H" | "Melee 2H" | "Ranged" | "Magic Staves" | "Tomes";

const CATEGORY_GROUPS: { label: WeaponCategory; types: string[] }[] = [
  { label: "Melee 1H", types: ["Sword", "Axe", "Dagger", "Hammer1h"] },
  { label: "Melee 2H", types: ["Greatsword", "Greataxe", "Hammer2h"] },
  { label: "Ranged", types: ["Bow", "Crossbow", "Gun"] },
  { label: "Magic Staves", types: ["Fire Staff", "Frost Staff", "Nature Staff", "Holy Staff", "Arcane Staff", "Lightning Staff"] },
  { label: "Tomes", types: ["Fire Tome", "Frost Tome", "Nature Tome", "Holy Tome", "Arcane Tome", "Lightning Tome"] },
];

function WeaponTypeCard({ type, weapons, isSelected, onSelect }: {
  type: string;
  weapons: Weapon[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const sprite = WEAPON_TYPE_SPRITES[type];
  const FallbackIcon = WEAPON_FALLBACK_ICON[type] || Sword;
  const glow = WEAPON_GLOW[type] || "hsl(43, 85%, 55%)";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all duration-200 group",
        isSelected
          ? "border-amber-500 bg-slate-800/80 shadow-lg"
          : "border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-800/60"
      )}
      style={isSelected ? { boxShadow: `0 0 16px ${glow}40` } : {}}
      data-testid={`weapon-type-${type.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(180deg, hsl(225 25% 18%) 0%, hsl(225 28% 12%) 100%)`, boxShadow: `0 0 10px ${glow}30` }}
        >
          {sprite ? (
            <img src={sprite} alt={type} className="w-10 h-10 object-contain" />
          ) : (
            <FallbackIcon className="w-6 h-6 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-heading font-bold text-white truncate">{type}</div>
          <div className="text-[10px] text-slate-400">{weapons.length} variants</div>
        </div>
        <ChevronRight className={cn("w-4 h-4 text-slate-600 transition-transform", isSelected && "text-amber-400 translate-x-0.5")} />
      </div>
    </button>
  );
}

function WeaponDetailPanel({ weapon }: { weapon: Weapon }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-white">{weapon.name}</span>
        <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/30">{weapon.category}</Badge>
      </div>
      <p className="text-[11px] text-slate-400 italic mb-2">{weapon.lore}</p>
      <div className="text-[10px] text-slate-500 mb-2">
        Basic: <span className="text-slate-300">{weapon.basicAbility}</span>
      </div>
      <div className="text-[10px] text-amber-400 mb-1">
        Signature: <span className="text-amber-300">{weapon.signatureAbility}</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {weapon.passives.map((p, i) => (
          <span key={i} className="text-[9px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded">
            {p.split("(")[0].trim()}
          </span>
        ))}
      </div>
      <div className="text-[10px] text-slate-500 mt-2">
        Crafted by: <span className="text-amber-400">{weapon.craftedBy}</span>
      </div>
    </div>
  );
}

export default function SkillTreePage() {
  const [selectedType, setSelectedType] = useState<string>("Sword");
  const [searchQuery, setSearchQuery] = useState("");

  const weaponsForType = useMemo(() => getWeaponsByType(selectedType), [selectedType]);

  const filteredWeapons = useMemo(() => {
    if (!searchQuery) return weaponsForType;
    const q = searchQuery.toLowerCase();
    return weaponsForType.filter(
      (w) => w.name.toLowerCase().includes(q) || w.lore.toLowerCase().includes(q)
    );
  }, [weaponsForType, searchQuery]);

  const sprite = WEAPON_TYPE_SPRITES[selectedType];
  const glow = WEAPON_GLOW[selectedType] || "hsl(43, 85%, 55%)";

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <header className="flex-shrink-0">
        <h1 className="text-3xl font-bold font-uncial gold-text mb-1">Weapon Skill Tree</h1>
        <p className="text-slate-400 text-sm">Browse weapon types, their skills, abilities, and passives.</p>
      </header>

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Left: Weapon type list by category */}
        <div className="w-72 flex-shrink-0 overflow-y-auto space-y-4 pr-1">
          {CATEGORY_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-heading mb-2 px-1">
                {group.label}
              </div>
              <div className="space-y-1.5">
                {group.types.map((type) => {
                  const weapons = getWeaponsByType(type);
                  return (
                    <WeaponTypeCard
                      key={type}
                      type={type}
                      weapons={weapons}
                      isSelected={selectedType === type}
                      onSelect={() => { setSelectedType(type); setSearchQuery(""); }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Selected weapon type detail */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <Card className="bg-slate-900/70 border-slate-700 mb-4">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl border-2 border-white/10 flex items-center justify-center overflow-hidden"
                  style={{ background: `linear-gradient(180deg, hsl(225 25% 16%) 0%, hsl(225 28% 10%) 100%)`, boxShadow: `0 0 20px ${glow}30` }}
                >
                  {sprite ? (
                    <img src={sprite} alt={selectedType} className="w-14 h-14 object-contain" />
                  ) : (
                    <Sword className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl font-uncial gold-text">{selectedType}</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">
                    {filteredWeapons.length} weapon{filteredWeapons.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search weapons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-600"
                  data-testid="search-skill-tree"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredWeapons.map((weapon) => (
              <WeaponDetailPanel key={weapon.id} weapon={weapon} />
            ))}
            {filteredWeapons.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No weapons found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
