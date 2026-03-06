import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, XCircle, Image as ImageIcon, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPRITE_MANIFEST, ASSET_CATEGORIES, SpriteCategory } from "@/lib/assets";

const DEFAULT_TIER_COLORS: Record<number, string> = {
  1: "#8B4513",
  2: "#708090", 
  3: "#228B22",
  4: "#4169E1",
  5: "#9932CC",
  6: "#FF8C00",
  7: "#DC143C",
  8: "#FFD700",
};

const TIER_NAMES: Record<number, string> = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary",
  6: "Mythic",
  7: "Divine",
  8: "Celestial",
};

const CATEGORY_LABELS: Record<SpriteCategory, { label: string; tier: string; color: string; hasTiers: boolean }> = {
  ore: { label: "Ores", tier: "T1-T8 Materials", color: "bg-amber-500", hasTiers: true },
  wood: { label: "Logs", tier: "T1-T8 Materials", color: "bg-green-600", hasTiers: true },
  component: { label: "Ingots", tier: "T1-T8 Components", color: "bg-slate-500", hasTiers: true },
  essence: { label: "Essences", tier: "T1-T8 Magic", color: "bg-purple-500", hasTiers: true },
  gem: { label: "Gems", tier: "T1-T8 Jewels", color: "bg-cyan-500", hasTiers: true },
  leather: { label: "Leather", tier: "T1-T4 Materials", color: "bg-orange-700", hasTiers: true },
  ingredient: { label: "Ingredients", tier: "Cooking", color: "bg-yellow-600", hasTiers: false },
  sword: { label: "Swords", tier: "T1-T8 Weapons", color: "bg-red-500", hasTiers: true },
  axe: { label: "Axes", tier: "T1-T8 Weapons", color: "bg-red-600", hasTiers: true },
  bow: { label: "Bows", tier: "T1-T4 Weapons", color: "bg-emerald-500", hasTiers: true },
  staff: { label: "Staves", tier: "T1-T4 Weapons", color: "bg-indigo-500", hasTiers: true },
  dagger: { label: "Daggers", tier: "T1-T4 Weapons", color: "bg-gray-600", hasTiers: true },
  hammer: { label: "Hammers", tier: "T1-T4 Weapons", color: "bg-stone-600", hasTiers: true },
};

function SpriteItem({ 
  itemId, 
  category, 
  tier, 
  tierColor,
  showTier 
}: { 
  itemId: string; 
  category: SpriteCategory; 
  tier: number;
  tierColor: string;
  showTier: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const path = `${ASSET_CATEGORIES.sprites[category]}/${itemId}.png`;
  const displayName = itemId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div 
      className="relative group flex flex-col items-center p-2 rounded-lg transition-all hover:scale-105"
      style={{ backgroundColor: showTier ? tierColor : 'rgba(0,0,0,0.3)' }}
      data-testid={`sprite-item-${itemId}-t${tier}`}
    >
      {showTier && (
        <div 
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          T{tier}
        </div>
      )}
      <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center relative">
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-500 animate-pulse" />
          </div>
        )}
        {error ? (
          <XCircle className="w-8 h-8 text-red-500" />
        ) : (
          <img
            src={path}
            alt={displayName}
            className={`w-full h-full object-contain transition-opacity drop-shadow-lg ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
        {loaded && !error && !showTier && (
          <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-green-500" />
        )}
      </div>
      <span className="text-xs text-center mt-1 text-white truncate w-full drop-shadow">
        {displayName}
      </span>
    </div>
  );
}

function TierColorEditor({ 
  tierColors, 
  onColorChange 
}: { 
  tierColors: Record<number, string>; 
  onColorChange: (tier: number, color: string) => void;
}) {
  return (
    <Card className="bg-black/40 border-white/10 mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-white" />
          <CardTitle className="text-white text-lg">Tier Background Colors</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(tier => (
            <div key={tier} className="flex flex-col items-center gap-1">
              <Label className="text-white text-xs">T{tier}</Label>
              <div 
                className="w-12 h-12 rounded-lg border-2 border-white/30 cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: tierColors[tier] }}
              >
                <Input
                  type="color"
                  value={tierColors[tier]}
                  onChange={(e) => onColorChange(tier, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  data-testid={`input-tier-color-${tier}`}
                />
              </div>
              <span className="text-[10px] text-white/60">{TIER_NAMES[tier]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TierPreview({ 
  tierColors, 
  category 
}: { 
  tierColors: Record<number, string>; 
  category: SpriteCategory;
}) {
  const items = SPRITE_MANIFEST[category];
  const maxTiers = Math.min(items.length, 8);
  
  return (
    <div className="flex gap-2 flex-wrap">
      {items.slice(0, maxTiers).map((itemId, index) => (
        <SpriteItem
          key={`${itemId}-t${index + 1}`}
          itemId={itemId}
          category={category}
          tier={index + 1}
          tierColor={tierColors[index + 1]}
          showTier={true}
        />
      ))}
    </div>
  );
}

export default function SpriteGallery() {
  const [tierColors, setTierColors] = useState<Record<number, string>>(DEFAULT_TIER_COLORS);
  const [showTierPreview, setShowTierPreview] = useState(true);
  const [previewCategory, setPreviewCategory] = useState<SpriteCategory>("ore");
  
  const categories = Object.keys(SPRITE_MANIFEST) as SpriteCategory[];
  const totalSprites = categories.reduce((sum, cat) => sum + SPRITE_MANIFEST[cat].length, 0);
  const tieredCategories = categories.filter(c => CATEGORY_LABELS[c].hasTiers);

  const handleColorChange = (tier: number, color: string) => {
    setTierColors(prev => ({ ...prev, [tier]: color }));
  };

  const resetColors = () => {
    setTierColors(DEFAULT_TIER_COLORS);
  };

  return (
    <div className="h-screen overflow-y-auto scroll-smooth bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto pb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" data-testid="button-back">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-page-title">
              AI Sprite Gallery
            </h1>
            <p className="text-white/60">
              {totalSprites} sprites with editable T1-T8 tier backgrounds
            </p>
          </div>
          <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/50">
            {totalSprites} Sprites
          </Badge>
        </div>

        <TierColorEditor tierColors={tierColors} onColorChange={handleColorChange} />

        <Card className="bg-black/40 border-white/10 mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-white text-lg">Tier Preview</CardTitle>
                <select
                  value={previewCategory}
                  onChange={(e) => setPreviewCategory(e.target.value as SpriteCategory)}
                  className="bg-black/50 text-white text-sm rounded px-2 py-1 border border-white/20"
                  data-testid="select-preview-category"
                >
                  {tieredCategories.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat].label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetColors}
                  className="text-xs"
                  data-testid="button-reset-colors"
                >
                  Reset Colors
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTierPreview(!showTierPreview)}
                  className="text-xs"
                  data-testid="button-toggle-preview"
                >
                  {showTierPreview ? "Hide" : "Show"} Tiers
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TierPreview tierColors={tierColors} category={previewCategory} />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {categories.map(category => {
            const items = SPRITE_MANIFEST[category];
            const info = CATEGORY_LABELS[category];
            
            return (
              <Card key={category} className="bg-black/40 border-white/10" data-testid={`card-category-${category}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Badge className={`${info.color} text-white`}>
                      {items.length}
                    </Badge>
                    <CardTitle className="text-white text-lg">{info.label}</CardTitle>
                    <span className="text-white/50 text-sm">{info.tier}</span>
                    {info.hasTiers && (
                      <Badge variant="outline" className="text-white/60 border-white/30 text-xs">
                        Tiered
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {items.map((itemId, index) => (
                      <SpriteItem 
                        key={itemId} 
                        itemId={itemId} 
                        category={category}
                        tier={info.hasTiers ? (index % 8) + 1 : 1}
                        tierColor={tierColors[(index % 8) + 1]}
                        showTier={info.hasTiers && showTierPreview}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-4 rounded-lg bg-black/40 border border-white/10">
          <h3 className="text-white font-semibold mb-2">Tier Color Reference</h3>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(tier => (
              <div 
                key={tier} 
                className="flex items-center gap-2 px-3 py-1 rounded"
                style={{ backgroundColor: tierColors[tier] }}
              >
                <span className="text-white text-sm font-bold">T{tier}</span>
                <span className="text-white/80 text-xs">{TIER_NAMES[tier]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
