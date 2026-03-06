import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Package, Sparkles, Skull, Coins, Loader2, ImageOff } from 'lucide-react';
import { 
  ALL_RECIPES, 
  calculateQualityChance,
  RECIPE_STATS,
  type Recipe,
  type RecipeAcquisition
} from '@/data/recipes';
import { useCharacter } from '@/contexts/CharacterContext';
import { getRecipeSpritePath } from '@/lib/assets';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import minerIcon from '@assets/generated_images/miner_profession_game_icon.png';
import foresterIcon from '@assets/generated_images/forester_profession_game_icon.png';
import mysticIcon from '@assets/generated_images/mystic_profession_game_icon.png';
import chefIcon from '@assets/generated_images/chef_profession_game_icon.png';
import engineerIcon from '@assets/generated_images/engineer_profession_game_icon.png';
import bossIcon from '/bossgrudge.png';

const PROFESSION_ICONS: Record<string, string> = {
  Miner: minerIcon,
  Forester: foresterIcon,
  Mystic: mysticIcon,
  Chef: chefIcon,
  Engineer: engineerIcon
};

const BOSS_ICON = bossIcon;

const ACQUISITION_COLORS: Record<RecipeAcquisition, string> = {
  purchasable: 'bg-green-600',
  skillTree: 'bg-blue-600',
  dropOnly: 'bg-purple-600'
};

const ACQUISITION_LABELS: Record<RecipeAcquisition, string> = {
  purchasable: 'Buy',
  skillTree: 'Skill Tree',
  dropOnly: 'Drop Only'
};

const CATEGORY_ICONS: Record<string, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  consumable: '🧪',
  material: '📦'
};

export default function RecipesInventory() {
  const { character, refreshCharacter } = useCharacter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('recipes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfession, setFilterProfession] = useState<string>('all');
  const [filterAcquisition, setFilterAcquisition] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Fetch unlocked recipes from backend
  const { data: unlockedRecipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['unlocked-recipes', character?.id],
    queryFn: async () => {
      if (!character?.id) return [];
      const res = await fetch(`/api/recipes/${character.id}`);
      if (!res.ok) throw new Error('Failed to fetch recipes');
      return res.json();
    },
    enabled: !!character?.id,
  });

  // Create a set of owned recipe IDs for quick lookup
  const ownedRecipeIds = new Set(unlockedRecipes.map((r: { recipeId: string }) => r.recipeId));

  // Mutation for purchasing recipes
  const purchaseRecipeMutation = useMutation({
    mutationFn: async ({ recipeId, recipeName }: { recipeId: string; recipeName: string }) => {
      const res = await fetch('/api/shop/buy-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character?.id,
          recipeId,
          recipeName,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to purchase recipe');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unlocked-recipes', character?.id] });
      refreshCharacter();
      toast({ title: 'Recipe Purchased!', description: `Recipe learned! Gold remaining: ${data.newGold}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Purchase Failed', description: error.message, variant: 'destructive' });
    },
  });

  const filteredRecipes = ALL_RECIPES.filter(recipe => {
    if (searchTerm && !recipe.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterProfession !== 'all' && recipe.profession !== filterProfession) return false;
    if (filterAcquisition !== 'all' && recipe.acquisition !== filterAcquisition) return false;
    if (filterCategory !== 'all' && recipe.category !== filterCategory) return false;
    return true;
  });

  const handlePurchaseRecipe = (recipe: Recipe) => {
    if (!recipe.purchaseCost) return;
    
    if (!character || character.gold < recipe.purchaseCost) {
      toast({ title: 'Not Enough Gold', description: `You need ${recipe.purchaseCost}g to purchase this recipe.`, variant: 'destructive' });
      return;
    }

    purchaseRecipeMutation.mutate({ recipeId: recipe.id, recipeName: recipe.name });
  };

  const renderRecipeCard = (recipe: Recipe) => {
    const isOwned = ownedRecipeIds.has(recipe.id);
    const isPurchasing = purchaseRecipeMutation.isPending;
    const spritePath = getRecipeSpritePath(recipe.id, recipe.subCategory);
    
    return (
      <Card 
        key={recipe.id} 
        className={`fantasy-panel border-2 ${isOwned ? 'border-green-500/50' : 'border-[hsl(43_40%_25%)]'} transition-all hover:border-[hsl(43_50%_40%)]`}
        data-testid={`recipe-card-${recipe.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[hsl(225_25%_15%)] border border-[hsl(43_30%_30%)] flex items-center justify-center overflow-hidden flex-shrink-0">
                {spritePath ? (
                  <img 
                    src={spritePath} 
                    alt={recipe.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={`text-xl ${spritePath ? 'hidden' : ''}`}>{CATEGORY_ICONS[recipe.category]}</span>
              </div>
              <CardTitle className="text-base text-[hsl(43_85%_65%)]">{recipe.name}</CardTitle>
            </div>
            <Badge className={`${ACQUISITION_COLORS[recipe.acquisition]} text-white text-xs flex items-center gap-1 px-2 py-1.5`}>
              {recipe.acquisition === 'skillTree' ? (
                <img 
                  src={PROFESSION_ICONS[recipe.profession]} 
                  alt={recipe.profession} 
                  className="w-8 h-8 object-scale-down rounded"
                  style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                />
              ) : recipe.acquisition === 'dropOnly' ? (
                <img 
                  src={BOSS_ICON} 
                  alt="Boss Drop" 
                  className="w-8 h-8 object-scale-down rounded"
                  style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                />
              ) : (
                ACQUISITION_LABELS[recipe.acquisition]
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[hsl(45_20%_55%)] mb-3">{recipe.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs border-[hsl(43_40%_30%)] text-[hsl(43_50%_50%)]">
              {recipe.profession}
            </Badge>
            <Badge variant="outline" className="text-xs border-[hsl(43_40%_30%)] text-[hsl(43_50%_50%)]">
              T{recipe.tierRange[0]}-T{recipe.tierRange[1]}
            </Badge>
            <Badge variant="outline" className="text-xs border-[hsl(43_40%_30%)] text-[hsl(43_50%_50%)]">
              {recipe.subCategory}
            </Badge>
          </div>

          {recipe.acquisition === 'purchasable' && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Coins className="w-4 h-4" />
                {recipe.purchaseCost}g
              </span>
              {isOwned ? (
                <Badge className="bg-green-600">Owned</Badge>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => handlePurchaseRecipe(recipe)}
                  disabled={isPurchasing}
                  className="bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700"
                  data-testid={`buy-recipe-${recipe.id}`}
                >
                  {isPurchasing ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 mr-1" />
                  )}
                  Buy
                </Button>
              )}
            </div>
          )}

          {recipe.acquisition === 'skillTree' && (
            <div className="text-sm text-blue-400">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Unlock: {recipe.unlockNode}
            </div>
          )}

          {recipe.acquisition === 'dropOnly' && (
            <div className="text-sm text-purple-400">
              <Skull className="w-4 h-4 inline mr-1" />
              Source: {recipe.dropSource}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <header className="flex-shrink-0">
        <h1 className="text-3xl font-bold font-heading gold-text mb-1">
          Recipes & Inventory
        </h1>
        <p className="text-slate-400 text-sm">
          Purchase recipes, view your collection, and manage your inventory
        </p>
        <div className="flex gap-3 mt-3 flex-wrap">
          <div className="stone-panel px-3 py-1.5 rounded border border-[hsl(43_40%_25%)]">
            <span className="text-[hsl(43_50%_50%)] text-xs">Total:</span>
            <span className="text-[hsl(43_85%_65%)] font-bold ml-1.5">{RECIPE_STATS.total}</span>
          </div>
          <div className="stone-panel px-3 py-1.5 rounded border border-green-600/30">
            <span className="text-green-400 text-xs">Buy:</span>
            <span className="text-green-300 font-bold ml-1.5">{RECIPE_STATS.purchasable}</span>
          </div>
          <div className="stone-panel px-3 py-1.5 rounded border border-blue-600/30">
            <span className="text-blue-400 text-xs">Skills:</span>
            <span className="text-blue-300 font-bold ml-1.5">{RECIPE_STATS.skillTree}</span>
          </div>
          <div className="stone-panel px-3 py-1.5 rounded border border-purple-600/30">
            <span className="text-purple-400 text-xs">Drops:</span>
            <span className="text-purple-300 font-bold ml-1.5">{RECIPE_STATS.dropOnly}</span>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 grid w-full grid-cols-2 mb-4 bg-[hsl(225_25%_12%)] border border-[hsl(43_40%_25%)]">
          <TabsTrigger 
            value="recipes" 
            className="data-[state=active]:bg-[hsl(43_50%_25%)] data-[state=active]:text-[hsl(43_85%_65%)]"
            data-testid="tab-recipes"
          >
            <Package className="w-4 h-4 mr-2" /> Recipe Ledger
          </TabsTrigger>
          <TabsTrigger 
            value="inventory" 
            className="data-[state=active]:bg-[hsl(43_50%_25%)] data-[state=active]:text-[hsl(43_85%_65%)]"
            data-testid="tab-inventory"
          >
            <ShoppingCart className="w-4 h-4 mr-2" /> My Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="flex-1 flex flex-col min-h-0 mt-0">
          <div className="flex-shrink-0 mb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(43_50%_40%)]" />
              <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[hsl(225_25%_12%)] border-[hsl(43_40%_25%)] text-[hsl(45_20%_75%)]"
                data-testid="search-recipes"
              />
            </div>
            
            <Select value={filterProfession} onValueChange={setFilterProfession}>
              <SelectTrigger className="w-[130px] bg-[hsl(225_25%_12%)] border-[hsl(43_40%_25%)]" data-testid="filter-profession">
                <SelectValue placeholder="Profession" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Professions</SelectItem>
                <SelectItem value="Miner">Miner</SelectItem>
                <SelectItem value="Forester">Forester</SelectItem>
                <SelectItem value="Mystic">Mystic</SelectItem>
                <SelectItem value="Chef">Chef</SelectItem>
                <SelectItem value="Engineer">Engineer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAcquisition} onValueChange={setFilterAcquisition}>
              <SelectTrigger className="w-[130px] bg-[hsl(225_25%_12%)] border-[hsl(43_40%_25%)]" data-testid="filter-acquisition">
                <SelectValue placeholder="Acquisition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchasable">Purchasable</SelectItem>
                <SelectItem value="skillTree">Skill Tree</SelectItem>
                <SelectItem value="dropOnly">Drop Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[130px] bg-[hsl(225_25%_12%)] border-[hsl(43_40%_25%)]" data-testid="filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="weapon">Weapons</SelectItem>
                <SelectItem value="armor">Armor</SelectItem>
                <SelectItem value="consumable">Consumables</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-shrink-0 text-xs text-[hsl(43_50%_50%)] mb-2">
            Showing {filteredRecipes.length} of {RECIPE_STATS.total} recipes
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredRecipes.map(renderRecipeCard)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <Card className="fantasy-panel border-2 border-[hsl(43_40%_25%)]">
              <CardHeader>
                <CardTitle className="text-[hsl(43_85%_65%)]">Your Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[hsl(43_80%_60%)] mb-3">Owned Recipes ({ownedRecipeIds.size})</h3>
                  {recipesLoading ? (
                    <div className="flex items-center gap-2 text-[hsl(45_20%_50%)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading recipes...
                    </div>
                  ) : ownedRecipeIds.size === 0 ? (
                    <p className="text-[hsl(45_20%_50%)]">No recipes owned yet. Purchase recipes from the Recipe Ledger!</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Array.from(ownedRecipeIds).map((recipeId) => {
                        const recipe = ALL_RECIPES.find(r => r.id === recipeId);
                        if (!recipe) return null;
                        return (
                          <div key={recipeId as string} className="stone-panel p-3 rounded border border-green-600/30">
                            <div className="flex items-center gap-2">
                              <span>{CATEGORY_ICONS[recipe.category]}</span>
                              <span className="text-sm text-[hsl(43_80%_65%)]">{recipe.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-[hsl(43_40%_25%)] pt-6">
                  <h3 className="text-lg font-bold text-[hsl(43_80%_60%)] mb-3">Quality Chances by Material Tier</h3>
                  <p className="text-sm text-[hsl(45_20%_55%)] mb-4">
                    Using higher tier materials increases your chance for better quality items!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map(tierDiff => {
                      const chances = calculateQualityChance(1, 1 + tierDiff);
                      return (
                        <div key={tierDiff} className="stone-panel p-4 rounded border border-[hsl(43_40%_25%)]">
                          <div className="font-bold text-[hsl(43_80%_60%)] mb-2">
                            {tierDiff === 0 ? 'Same Tier Materials' : `+${tierDiff} Tier Materials`}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-400">Normal: <span className="text-white">{chances.normal}%</span></div>
                            <div className="text-green-400">Enhanced: <span className="text-green-300">{chances.enhanced}%</span></div>
                            <div className="text-blue-400">Masterwork: <span className="text-blue-300">{chances.masterwork}%</span></div>
                            <div className="text-purple-400">Legendary: <span className="text-purple-300">{chances.legendary}%</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
