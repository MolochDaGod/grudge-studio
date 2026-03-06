import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCharacter } from "@/contexts/CharacterContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Play, X, CheckCircle, Loader2, Package, Hammer, Lock } from "lucide-react";
import craftingBg from '@assets/19b5eaf028559_1766824785613.png';
import minerBg from '@assets/19b5ef8344550_1766824963866.png';
import chefBg from '@assets/19b5ef82a42b7_1766824985064.png';
import foresterBg from '@assets/19b5ef87e834d_1766824973931.png';
import engineerBg from '@assets/19b795f08bcaa.png';
import mysticBg from '@assets/19b795f00f069.png';
import refinersBg from '@assets/19b795efb9280.png';
import gemIcon from '@assets/generated_images/mystic_profession_game_icon.png';

const PROFESSION_BACKGROUNDS: Record<string, string> = {
  'All': refinersBg,
  'Miner': minerBg,
  'Forester': foresterBg,
  'Mystic': mysticBg,
  'Chef': chefBg,
  'Engineer': engineerBg,
};

import { 
  ALL_STARTER_RECIPES, 
  STARTER_RECIPES_BY_PROFESSION,
  CRAFTING_STATIONS,
  type StarterRecipe 
} from "@/data/starterRecipes";

interface CraftingJob {
  id: string;
  characterId: string;
  recipeId: string;
  quantity: number;
  duration: number;
  startedAt: string;
  completesAt: string;
  status: string;
}

interface InventoryItem {
  id: number;
  characterId: number;
  itemName: string;
  quantity: number;
  itemType: string;
  tier: string | null;
  metadata: Record<string, unknown> | null;
}

interface ProfessionProgress {
  level: number;
  xp: number;
  pointsSpent: number;
}

const PROFESSIONS = [
  { id: 'All', name: 'Universal', icon: '📜', color: 'text-slate-400' },
  { id: 'Miner', name: 'Miner', icon: '⚒️', color: 'text-amber-500' },
  { id: 'Forester', name: 'Forester', icon: '🌲', color: 'text-green-500' },
  { id: 'Mystic', name: 'Mystic', icon: '🔮', color: 'text-purple-500' },
  { id: 'Chef', name: 'Chef', icon: '👨‍🍳', color: 'text-orange-500' },
  { id: 'Engineer', name: 'Engineer', icon: '🔧', color: 'text-orange-600' },
];

const TIER_UNLOCK_LEVELS: Record<number, number> = {
  0: 1,
  1: 1,
  2: 10,
  3: 20,
  4: 30,
  5: 40,
  6: 50,
  7: 60,
  8: 70,
};

const CRAFT_XP_BY_TIER: Record<number, number> = {
  0: 10,
  1: 25,
  2: 50,
  3: 100,
  4: 200,
  5: 400,
  6: 800,
  7: 1600,
  8: 3200,
};

function formatTimeRemaining(completesAt: string): string {
  const now = Date.now();
  const end = new Date(completesAt).getTime();
  const diff = Math.max(0, end - now);
  
  if (diff === 0) return "Ready!";
  
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / 60000) % 60;
  const hours = Math.floor(diff / 3600000);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatCraftTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

const cardStyle = "border-2 border-[hsl(43_40%_25%)] bg-[hsl(225_30%_8%)] rounded-xl";
const headerStyle = "border-b-2 border-[hsl(43_40%_25%)] bg-[hsl(225_30%_8%)]";

export default function CraftingPage() {
  const { character } = useCharacter();
  const queryClient = useQueryClient();
  const [activeProfession, setActiveProfession] = useState("All");
  const [activeTier, setActiveTier] = useState<number | 'All'>('All');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const professionProgress = (character?.professionProgression || {}) as Record<string, ProfessionProgress>;
  
  const getMaxUnlockedTier = (profession: string): number => {
    if (profession === 'All') {
      const minLevel = Math.min(
        professionProgress.Miner?.level || 1,
        professionProgress.Forester?.level || 1,
        professionProgress.Mystic?.level || 1,
        professionProgress.Chef?.level || 1,
        professionProgress.Engineer?.level || 1
      );
      return Object.entries(TIER_UNLOCK_LEVELS)
        .filter(([, reqLevel]) => minLevel >= reqLevel)
        .map(([tier]) => parseInt(tier))
        .sort((a, b) => b - a)[0] || 0;
    }
    const level = professionProgress[profession]?.level || 1;
    return Object.entries(TIER_UNLOCK_LEVELS)
      .filter(([, reqLevel]) => level >= reqLevel)
      .map(([tier]) => parseInt(tier))
      .sort((a, b) => b - a)[0] || 0;
  };

  const currentProfession = PROFESSIONS.find(p => p.id === activeProfession) || PROFESSIONS[0];
  const maxTier = getMaxUnlockedTier(activeProfession);
  
  const allRecipes = activeProfession === 'All' 
    ? ALL_STARTER_RECIPES 
    : [...(STARTER_RECIPES_BY_PROFESSION[activeProfession] || []), ...STARTER_RECIPES_BY_PROFESSION.All];
  
  const filteredRecipes = allRecipes.filter(r => 
    activeTier === 'All' || r.tier === activeTier
  );

  const selectedRecipe = allRecipes.find(r => r.id === selectedRecipeId) || filteredRecipes[0];

  const { data: craftingJobs = [], isLoading: jobsLoading } = useQuery<CraftingJob[]>({
    queryKey: ["/api/crafting-jobs", character?.id],
    queryFn: () => apiRequest("GET", `/api/crafting-jobs/${character?.id}`).then(r => r.json()),
    enabled: !!character?.id,
    refetchInterval: 5000,
  });

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", character?.id],
    queryFn: () => apiRequest("GET", `/api/inventory/${character?.id}`).then(r => r.json()),
    enabled: !!character?.id,
    refetchInterval: 10000,
  });

  const inventoryMap = inventory.reduce((acc, item) => {
    acc[item.itemName] = (acc[item.itemName] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const canCraft = (recipe: StarterRecipe) => {
    if (!recipe) return false;
    if (recipe.tier > maxTier) return false;
    return recipe.inputs.every(input => 
      (inventoryMap[input.itemId] || 0) >= input.quantity
    );
  };

  const isTierLocked = (recipe: StarterRecipe) => {
    const profMaxTier = recipe.profession === 'All' 
      ? getMaxUnlockedTier('All')
      : getMaxUnlockedTier(recipe.profession);
    return recipe.tier > profMaxTier;
  };

  const startJobMutation = useMutation({
    mutationFn: async (recipe: StarterRecipe) => {
      if (!character || !recipe) throw new Error("No character or recipe selected");
      return apiRequest("POST", "/api/crafting-jobs", {
        characterId: character.id,
        recipeId: recipe.id,
        quantity: 1,
        duration: recipe.craftingTime,
        inputItems: recipe.inputs.map(input => ({ name: input.itemId, quantity: input.quantity })),
        profession: recipe.profession,
        tier: recipe.tier,
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crafting-jobs", character?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", character?.id] });
    },
  });

  const claimJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/crafting-jobs/${jobId}/claim`).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crafting-jobs", character?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", character?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("DELETE", `/api/crafting-jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crafting-jobs", character?.id] });
    },
  });

  const pendingJobs = craftingJobs.filter(j => j.status === 'pending');
  const completedJobs = pendingJobs.filter(j => new Date(j.completesAt) <= new Date());
  const activeJobs = pendingJobs.filter(j => new Date(j.completesAt) > new Date());

  const handleStartCraft = () => {
    if (selectedRecipe && canCraft(selectedRecipe)) {
      startJobMutation.mutate(selectedRecipe);
    }
  };

  const getRecipeName = (recipeId: string) => {
    const recipe = ALL_STARTER_RECIPES.find(r => r.id === recipeId);
    return recipe?.name || recipeId;
  };

  const allTiers = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const currentBackground = PROFESSION_BACKGROUNDS[activeProfession] || craftingBg;

  return (
    <div 
      className="min-h-screen relative transition-all duration-500"
      style={{
        backgroundImage: `url(${currentBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className={cn("px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2", headerStyle)}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Hammer className="w-6 h-6 sm:w-8 sm:h-8 text-[hsl(43_85%_55%)] flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold font-uncial text-[hsl(43_85%_65%)] truncate">Crafting Guild</h1>
              <p className="text-[10px] sm:text-xs text-[hsl(43_60%_50%)] font-heading tracking-wider hidden sm:block">Profession Recipes & AFK Queue</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="text-right">
              <div className={cn("text-sm sm:text-lg font-bold font-heading", currentProfession.color)}>
                {currentProfession.icon} <span className="hidden sm:inline">{currentProfession.name}</span>
              </div>
              {activeProfession !== 'All' && professionProgress[activeProfession] && (
                <div className="text-[10px] sm:text-xs text-slate-400">
                  Lv.{professionProgress[activeProfession].level} • T{maxTier}
                </div>
              )}
            </div>
            {character && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(43_40%_25%)] bg-[hsl(225_28%_12%)]">
                <Package className="w-4 h-4 text-[hsl(43_85%_55%)]" />
                <span className="text-sm text-[hsl(43_85%_65%)]">{inventory.length} Items</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-2 sm:p-4">
          <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 border-b-2 border-[hsl(43_40%_25%)] pb-3 sm:pb-4 overflow-x-auto scrollbar-hide">
            {PROFESSIONS.map((prof) => {
              const profLevel = prof.id === 'All' ? null : professionProgress[prof.id]?.level || 1;
              return (
                <button
                  key={prof.id}
                  data-testid={`profession-tab-${prof.id}`}
                  onClick={() => {
                    setActiveProfession(prof.id);
                    setSelectedRecipeId(null);
                  }}
                  className={cn(
                    "px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border-2 font-bold transition-all whitespace-nowrap flex items-center gap-1 sm:gap-2 text-sm sm:text-base",
                    activeProfession === prof.id 
                      ? `bg-[hsl(225_28%_14%)] ${prof.color} border-[hsl(43_50%_35%)] shadow-lg shadow-black/30`
                      : "bg-[hsl(225_30%_8%)] border-[hsl(43_40%_20%)] text-slate-400 hover:border-[hsl(43_40%_30%)] hover:text-slate-300"
                  )}
                >
                  <span className="text-base sm:text-lg">{prof.icon}</span> 
                  <span className="hidden sm:inline">{prof.name}</span>
                  {profLevel && <span className="text-[10px] sm:text-xs opacity-70">Lv.{profLevel}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="flex flex-wrap gap-1 p-1 sm:p-1.5 rounded-lg border-2 border-[hsl(43_40%_25%)] bg-[hsl(225_30%_8%)] max-w-full">
              <button
                 data-testid="tier-all"
                 onClick={() => setActiveTier('All')}
                 className={cn(
                   "px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-bold transition-colors",
                   activeTier === 'All' ? "bg-[hsl(43_85%_55%)] text-[hsl(225_30%_8%)]" : "text-slate-500 hover:text-slate-300"
                 )}
              >
                All
              </button>
              {allTiers.map((tier) => {
                const isLocked = tier > maxTier;
                const hasRecipes = allRecipes.some(r => r.tier === tier);
                return (
                  <button
                    key={tier}
                    data-testid={`tier-${tier}`}
                    onClick={() => setActiveTier(tier)}
                    className={cn(
                      "px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-bold transition-colors flex items-center gap-0.5 sm:gap-1",
                      activeTier === tier 
                        ? "bg-amber-500 text-black" 
                        : isLocked 
                          ? "text-slate-600 opacity-50" 
                          : !hasRecipes
                            ? "text-slate-500 opacity-30"
                            : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {isLocked && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                    T{tier}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className={cn(cardStyle, "p-3 sm:p-4 min-h-[300px] sm:min-h-[400px] lg:h-[500px] flex flex-col")}>
              <h3 className="font-bold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base text-[hsl(43_85%_65%)] font-heading">Recipes ({filteredRecipes.length})</h3>
              <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map((recipe) => {
                    const hasIngredients = canCraft(recipe);
                    const locked = isTierLocked(recipe);
                    return (
                      <div
                        key={recipe.id}
                        data-testid={`recipe-${recipe.id}`}
                        onClick={() => !locked && setSelectedRecipeId(recipe.id)}
                        className={cn(
                          "p-3 rounded-lg flex justify-between items-center transition-all border",
                          locked 
                            ? "bg-slate-800/30 border-slate-700/30 cursor-not-allowed opacity-50"
                            : (selectedRecipe?.id === recipe.id)
                              ? "bg-[hsl(43_85%_55%)]/10 border-[hsl(43_85%_55%)] border-l-4 cursor-pointer" 
                              : "bg-[hsl(225_28%_12%)] border-[hsl(43_40%_20%)] hover:border-[hsl(43_40%_30%)] cursor-pointer",
                          !hasIngredients && !locked && "opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {locked && <Lock className="w-4 h-4 text-slate-500" />}
                          <span className={cn("font-medium", selectedRecipe?.id === recipe.id ? "text-[hsl(43_85%_65%)]" : "text-slate-300")}>
                            {recipe.name}
                          </span>
                          {!hasIngredients && !locked && <span className="text-[10px] text-red-400">(missing)</span>}
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded border",
                          locked 
                            ? "text-slate-600 bg-slate-800/30 border-slate-700/30"
                            : "text-[hsl(43_60%_50%)] bg-[hsl(225_30%_12%)] border-[hsl(43_40%_20%)]"
                        )}>T{recipe.tier}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-500 py-8 italic">No recipes found</div>
                )}
              </div>
            </div>

            <div className={cn(cardStyle, "md:col-span-2 p-4 sm:p-6 flex flex-col min-h-[350px] sm:min-h-[450px] lg:h-[500px]")}>
              {selectedRecipe ? (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold font-heading text-[hsl(43_85%_65%)] mb-1">{selectedRecipe.name}</h3>
                      <p className="text-sm text-[hsl(43_60%_50%)]">{selectedRecipe.type} • {selectedRecipe.profession}</p>
                      <p className="text-xs text-slate-400 mt-1 italic">{selectedRecipe.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="text-lg px-4 py-1 bg-amber-500 text-black hover:bg-amber-400 border-0">
                        T{selectedRecipe.tier}
                      </Badge>
                      <div className="text-xs text-green-400 mt-1">+{CRAFT_XP_BY_TIER[selectedRecipe.tier] || 10} XP</div>
                    </div>
                  </div>

                  <div className="bg-[hsl(225_28%_12%)] rounded-xl p-4 border-2 border-[hsl(43_40%_20%)] mb-4 flex-1 overflow-auto">
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-[hsl(43_60%_50%)]">Required Materials</h4>
                    <ul className="space-y-2">
                      {selectedRecipe.inputs.map((input) => {
                        const have = inventoryMap[input.itemId] || 0;
                        const enough = have >= input.quantity;
                        return (
                          <li key={input.itemId} className="flex justify-between items-center border-b border-[hsl(43_40%_15%)] pb-2 last:border-0">
                            <span className={cn("flex items-center gap-2", enough ? "text-slate-300" : "text-red-400")}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", enough ? "bg-green-500" : "bg-red-500")}></span>
                              {input.itemId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                            <span className={cn("font-mono text-sm", enough ? "text-green-400" : "text-red-400")}>
                              {have}/{input.quantity}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    
                    <h4 className="font-bold mt-4 mb-2 text-sm uppercase tracking-widest text-green-500">Output</h4>
                    <ul className="space-y-1">
                      {selectedRecipe.outputs.map((output) => (
                        <li key={output.itemId} className="flex justify-between items-center text-green-400">
                          <span>{output.itemId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                          <span className="font-mono">×{output.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="bg-blue-500/10 border-2 border-blue-500/30 p-3 rounded-lg text-center">
                      <div className="text-xs text-blue-400 uppercase font-bold mb-1">Craft Time</div>
                      <div className="text-xl font-bold text-blue-300">{formatCraftTime(selectedRecipe.craftingTime)}</div>
                    </div>
                    <div className="bg-purple-500/10 border-2 border-purple-500/30 p-3 rounded-lg text-center">
                      <div className="text-xs text-purple-400 uppercase font-bold mb-1">Station</div>
                      <div className="text-sm font-bold text-purple-300">
                        {selectedRecipe.requiredStation 
                          ? CRAFTING_STATIONS[selectedRecipe.requiredStation as keyof typeof CRAFTING_STATIONS]?.name || 'Any'
                          : 'Any'}
                      </div>
                    </div>
                  </div>

                  <Button 
                    data-testid="button-start-craft"
                    className={cn(
                      "w-full h-12 text-lg font-bold transition-all border-2",
                      canCraft(selectedRecipe)
                        ? "bg-gradient-to-r from-[hsl(43_85%_45%)] to-[hsl(35_90%_40%)] hover:from-[hsl(43_85%_55%)] hover:to-[hsl(35_90%_50%)] text-[hsl(225_30%_8%)] border-[hsl(43_85%_55%)]"
                        : "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed"
                    )}
                    onClick={handleStartCraft}
                    disabled={startJobMutation.isPending || !character || !canCraft(selectedRecipe)}
                  >
                    {startJobMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Starting...</>
                    ) : isTierLocked(selectedRecipe) ? (
                      <><Lock className="w-5 h-5 mr-2" /> Unlock at Lv.{TIER_UNLOCK_LEVELS[selectedRecipe.tier]}</>
                    ) : !canCraft(selectedRecipe) ? (
                      "Missing Materials"
                    ) : (
                      <><Play className="w-5 h-5 mr-2" /> Start Craft</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <p>Select a recipe to view details</p>
                </div>
              )}
            </div>

            <div className={cn(cardStyle, "p-3 sm:p-4 min-h-[300px] sm:min-h-[400px] lg:h-[500px] flex flex-col")}>
              <h3 className="font-bold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base text-[hsl(43_85%_65%)] font-heading">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> Queue
              </h3>
              
              {!character ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                  Log in to use crafting
                </div>
              ) : jobsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  {completedJobs.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-green-400 uppercase font-bold mb-2">Ready to Claim</div>
                      {completedJobs.map((job) => (
                        <div 
                          key={job.id}
                          data-testid={`job-completed-${job.id}`}
                          className="p-3 rounded-lg bg-green-500/10 border-2 border-green-500/30 mb-2"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-green-300 text-sm">{getRecipeName(job.recipeId)}</span>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </div>
                          <Button
                            data-testid={`button-claim-${job.id}`}
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-500 border-2 border-green-400"
                            onClick={() => claimJobMutation.mutate(job.id)}
                            disabled={claimJobMutation.isPending}
                          >
                            Claim
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeJobs.length > 0 && (
                    <div>
                      <div className="text-xs text-amber-400 uppercase font-bold mb-2">In Progress</div>
                      {activeJobs.map((job) => (
                        <div 
                          key={job.id}
                          data-testid={`job-active-${job.id}`}
                          className="p-3 rounded-lg bg-amber-500/10 border-2 border-amber-500/30 mb-2"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-amber-300 text-sm">{getRecipeName(job.recipeId)}</span>
                            <span className="text-xs text-amber-400 font-mono">{formatTimeRemaining(job.completesAt)}</span>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-2 mb-2 border border-amber-500/20">
                            <div 
                              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((Date.now() - new Date(job.startedAt).getTime()) / (job.duration * 1000)) * 100)}%`
                              }}
                            />
                          </div>
                          <Button
                            data-testid={`button-cancel-${job.id}`}
                            size="sm"
                            variant="ghost"
                            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                            onClick={() => cancelJobMutation.mutate(job.id)}
                            disabled={cancelJobMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingJobs.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm py-8">
                      <Clock className="w-8 h-8 mb-2 opacity-50" />
                      <p>No active crafts</p>
                      <p className="text-xs mt-1 text-[hsl(43_60%_50%)]">Select a recipe to begin</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <div className={cn(cardStyle, "p-4 sm:p-6")}>
              <h3 className="font-bold mb-3 sm:mb-4 text-[hsl(43_85%_65%)] font-heading flex items-center gap-2 text-sm sm:text-base">
                <img src={gemIcon} alt="Mystic" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                <span className="text-lg sm:text-xl">Mystic</span> Enchant Sockets
              </h3>
              <p className="text-xs sm:text-sm text-[hsl(43_60%_50%)] mb-3 sm:mb-4">Add gem-based enchantments to gear</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 text-sm">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div 
                    key={i} 
                    className="p-2 sm:p-4 border-2 border-dashed border-[hsl(43_40%_25%)] rounded-lg text-center hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer transition-colors flex flex-col items-center bg-[hsl(225_28%_12%)]"
                  >
                    <img src={gemIcon} alt={`Gem Slot ${i}`} className="w-6 h-6 sm:w-8 sm:h-8 object-contain opacity-30 mb-1 sm:mb-2" />
                    <div className="text-[10px] sm:text-xs text-[hsl(43_60%_50%)]">Slot {i}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
