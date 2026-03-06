import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  ScrollText, 
  Package, 
  Coins, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Minus,
  History
} from "lucide-react";
import { useCharacter } from "@/contexts/CharacterContext";
import { CRAFTING_MATERIALS } from "@/data/materials";
import { ALL_RECIPES, getPurchasableRecipes } from "@/domains/crafting";
import walletBg from '@assets/19b5ef87ac892_1766824989260.png';

const TIER_COLORS: Record<number, string> = {
  1: "bg-gray-500",
  2: "bg-green-600",
  3: "bg-blue-600",
  4: "bg-purple-600",
  5: "bg-orange-600",
  6: "bg-red-600",
  7: "bg-pink-600",
  8: "bg-yellow-500",
};

const TIER_PRICE_MULTIPLIERS: Record<number, number> = {
  1: 1, 2: 2.5, 3: 5, 4: 10, 5: 20, 6: 40, 7: 80, 8: 160,
};

function calculatePrice(basePrice: number, tier: number = 1): number {
  return Math.floor(basePrice * (TIER_PRICE_MULTIPLIERS[tier] || 1));
}

function calculateSellPrice(buyPrice: number): number {
  return Math.floor(buyPrice * 0.3);
}

type TabValue = "materials" | "recipes" | "sell" | "history";

export default function ShopPage() {
  const { character, refreshCharacter } = useCharacter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabValue>("materials");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory", character?.id],
    queryFn: async () => {
      if (!character?.id) return [];
      const res = await fetch(`/api/inventory/${character.id}`);
      return res.json();
    },
    enabled: !!character?.id,
  });

  const { data: craftedItems = [] } = useQuery({
    queryKey: ["/api/crafted-items", character?.id],
    queryFn: async () => {
      if (!character?.id) return [];
      const res = await fetch(`/api/crafted-items/${character.id}`);
      return res.json();
    },
    enabled: !!character?.id,
  });

  const { data: unlockedRecipes = [] } = useQuery({
    queryKey: ["/api/recipes", character?.id],
    queryFn: async () => {
      if (!character?.id) return [];
      const res = await fetch(`/api/recipes/${character.id}`);
      return res.json();
    },
    enabled: !!character?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/shop/transactions", character?.id],
    queryFn: async () => {
      if (!character?.id) return [];
      const res = await fetch(`/api/shop/transactions/${character.id}`);
      return res.json();
    },
    enabled: !!character?.id,
  });

  const buyMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/shop/buy-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to buy material");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/transactions"] });
      refreshCharacter();
      setBuyDialogOpen(false);
      setQuantity(1);
      toast({ title: "Purchase Complete", description: "Items added to inventory!" });
    },
    onError: (error: Error) => {
      toast({ title: "Purchase Failed", description: error.message, variant: "destructive" });
    },
  });

  const buyRecipeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/shop/buy-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to buy recipe");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/transactions"] });
      refreshCharacter();
      setBuyDialogOpen(false);
      toast({ title: "Recipe Learned!", description: "Recipe added to your collection!" });
    },
    onError: (error: Error) => {
      toast({ title: "Purchase Failed", description: error.message, variant: "destructive" });
    },
  });

  const sellMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/shop/sell-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to sell material");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/transactions"] });
      refreshCharacter();
      setSellDialogOpen(false);
      setQuantity(1);
      toast({ title: "Sale Complete", description: "Gold added to your purse!" });
    },
    onError: (error: Error) => {
      toast({ title: "Sale Failed", description: error.message, variant: "destructive" });
    },
  });

  const sellItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/shop/sell-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to sell item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crafted-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/transactions"] });
      refreshCharacter();
      setSellDialogOpen(false);
      toast({ title: "Item Sold!", description: "Gold added to your purse!" });
    },
    onError: (error: Error) => {
      toast({ title: "Sale Failed", description: error.message, variant: "destructive" });
    },
  });

  const unlockedRecipeIds = new Set(unlockedRecipes.map((r: any) => r.recipeId));
  const purchasableRecipes = getPurchasableRecipes().filter(
    (r) => !unlockedRecipeIds.has(r.id)
  );

  const sellableMaterials = CRAFTING_MATERIALS.map((mat) => {
    const invItem = inventory.find((i: any) => i.itemName === mat.name);
    return { ...mat, owned: invItem?.quantity || 0 };
  }).filter((m) => m.owned > 0);

  const filteredMaterials = CRAFTING_MATERIALS.filter((mat) => {
    const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === null || mat.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const filteredRecipes = purchasableRecipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleBuyMaterial = () => {
    if (!character || !selectedItem) return;
    buyMaterialMutation.mutate({
      characterId: character.id,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity,
      tier: selectedItem.tier,
    });
  };

  const handleBuyRecipe = () => {
    if (!character || !selectedItem) return;
    buyRecipeMutation.mutate({
      characterId: character.id,
      recipeId: selectedItem.id,
      recipeName: selectedItem.name,
    });
  };

  const handleSellMaterial = () => {
    if (!character || !selectedItem) return;
    sellMaterialMutation.mutate({
      characterId: character.id,
      itemName: selectedItem.name,
      quantity,
      tier: selectedItem.tier,
    });
  };

  const handleSellItem = (item: any) => {
    if (!character) return;
    sellItemMutation.mutate({
      characterId: character.id,
      itemId: item.id,
    });
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="fantasy-panel border-2 border-[hsl(43_50%_35%)] p-8">
          <p className="text-[hsl(45_30%_70%)]">Please create a character first to access the shop.</p>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${walletBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
      <div className="relative z-10 flex flex-col h-full min-h-0 p-4 gap-4">
        <div className="flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-[hsl(43_85%_55%)]" />
            <div>
              <h1 className="text-2xl font-uncial gold-text">Trading Post</h1>
              <p className="text-xs text-[hsl(45_20%_55%)]">Buy & Sell Resources, Recipes, and Items</p>
            </div>
          </div>
          <div className="flex items-center gap-2 inset-panel px-4 py-2 rounded-lg">
            <Coins className="w-5 h-5 text-[hsl(43_85%_55%)]" />
            <span className="text-lg font-bold text-[hsl(43_85%_55%)]" data-testid="text-shop-gold">
              {character.gold.toLocaleString()}
            </span>
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="flex-shrink-0 grid grid-cols-4 bg-[hsl(225_25%_12%)] border border-[hsl(43_40%_25%)]">
          <TabsTrigger value="materials" className="data-[state=active]:bg-[hsl(43_50%_25%)] data-[state=active]:text-[hsl(43_85%_65%)]" data-testid="tab-materials">
            <Package className="w-4 h-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="recipes" className="data-[state=active]:bg-[hsl(43_50%_25%)] data-[state=active]:text-[hsl(43_85%_65%)]" data-testid="tab-recipes">
            <ScrollText className="w-4 h-4 mr-2" />
            Recipes
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-[hsl(43_50%_25%)] data-[state=active]:text-[hsl(43_85%_65%)]" data-testid="tab-sell">
            <TrendingDown className="w-4 h-4 mr-2" />
            Sell
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-[hsl(43_50%_25%)] data-[state=active]:text-[hsl(43_85%_65%)]" data-testid="tab-history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden mt-4">
          <TabsContent value="materials" className="h-full m-0 flex flex-col gap-4">
            <div className="flex-shrink-0 flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(45_20%_50%)]" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 inset-panel border-[hsl(43_40%_30%)]"
                  data-testid="input-search-materials"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant={selectedTier === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTier(null)}
                >
                  All
                </Button>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((tier) => (
                  <Button
                    key={tier}
                    variant={selectedTier === tier ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTier(tier)}
                    className={selectedTier === tier ? TIER_COLORS[tier] : ""}
                  >
                    T{tier}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredMaterials.map((material) => {
                  const price = calculatePrice(50, material.tier);
                  const canAfford = character.gold >= price;
                  return (
                    <Card 
                      key={material.id} 
                      className="fantasy-panel border border-[hsl(43_40%_25%)] hover:border-[hsl(43_50%_40%)] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedItem(material);
                        setQuantity(1);
                        setBuyDialogOpen(true);
                      }}
                      data-testid={`card-material-${material.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{material.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[hsl(45_30%_80%)] truncate">{material.name}</span>
                              <Badge className={`${TIER_COLORS[material.tier]} text-white text-[10px]`}>
                                T{material.tier}
                              </Badge>
                            </div>
                            <p className="text-xs text-[hsl(45_20%_50%)] mt-1 line-clamp-2">{material.description}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <Coins className="w-3 h-3 text-[hsl(43_85%_55%)]" />
                              <span className={`text-sm font-bold ${canAfford ? 'text-[hsl(43_85%_55%)]' : 'text-red-400'}`}>
                                {price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recipes" className="h-full m-0 flex flex-col gap-4">
            <div className="flex-shrink-0 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(45_20%_50%)]" />
              <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 inset-panel border-[hsl(43_40%_30%)]"
                data-testid="input-search-recipes"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              {filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[hsl(45_20%_55%)]">
                  <ScrollText className="w-12 h-12 mb-4 opacity-50" />
                  <p>No recipes available for purchase</p>
                  <p className="text-sm">All purchasable recipes have been learned!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredRecipes.map((recipe) => {
                    const price = recipe.purchaseCost || 500;
                    const canAfford = character.gold >= price;
                    return (
                      <Card 
                        key={recipe.id} 
                        className="fantasy-panel border border-[hsl(43_40%_25%)] hover:border-[hsl(43_50%_40%)] transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedItem(recipe);
                          setBuyDialogOpen(true);
                        }}
                        data-testid={`card-recipe-${recipe.id}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <ScrollText className="w-4 h-4 text-[hsl(43_85%_55%)]" />
                                <span className="font-medium text-[hsl(45_30%_80%)]">{recipe.name}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{recipe.category}</Badge>
                                <Badge variant="outline" className="text-[10px]">{recipe.profession}</Badge>
                              </div>
                              <p className="text-xs text-[hsl(45_20%_50%)] mt-2 line-clamp-2">{recipe.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-3">
                            <Coins className="w-3 h-3 text-[hsl(43_85%_55%)]" />
                            <span className={`text-sm font-bold ${canAfford ? 'text-[hsl(43_85%_55%)]' : 'text-red-400'}`}>
                              {price.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sell" className="h-full m-0 flex flex-col gap-4">
            <div className="flex-shrink-0 text-sm text-[hsl(45_20%_55%)]">
              Sell items for 30% of their buy price
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              <div className="space-y-4">
                {sellableMaterials.length > 0 && (
                  <div>
                    <h3 className="text-lg font-heading gold-text mb-2">Materials</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sellableMaterials.map((material) => {
                        const buyPrice = calculatePrice(50, material.tier);
                        const sellPrice = calculateSellPrice(buyPrice);
                        return (
                          <Card 
                            key={material.id} 
                            className="fantasy-panel border border-[hsl(43_40%_25%)] hover:border-[hsl(43_50%_40%)] transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedItem(material);
                              setQuantity(1);
                              setSellDialogOpen(true);
                            }}
                            data-testid={`card-sell-material-${material.id}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="text-2xl">{material.icon}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-[hsl(45_30%_80%)]">{material.name}</span>
                                    <Badge className={`${TIER_COLORS[material.tier]} text-white text-[10px]`}>
                                      T{material.tier}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-[hsl(45_20%_50%)]">Owned: {material.owned}</p>
                                  <div className="flex items-center gap-1 mt-2">
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                    <span className="text-sm font-bold text-green-500">
                                      +{sellPrice.toLocaleString()}/ea
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {craftedItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-heading gold-text mb-2">Crafted Items</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {craftedItems.map((item: any) => {
                        const buyPrice = calculatePrice(200, item.tier);
                        const sellPrice = calculateSellPrice(buyPrice);
                        return (
                          <Card 
                            key={item.id} 
                            className="fantasy-panel border border-[hsl(43_40%_25%)] hover:border-[hsl(43_50%_40%)] transition-colors"
                            data-testid={`card-sell-item-${item.id}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-[hsl(45_30%_80%)]">{item.itemName}</span>
                                    <Badge className={`${TIER_COLORS[item.tier]} text-white text-[10px]`}>
                                      T{item.tier}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-[hsl(45_20%_50%)]">{item.itemType}</p>
                                </div>
                                {item.equipped && (
                                  <Badge variant="outline" className="text-[10px] border-green-500 text-green-500">
                                    Equipped
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                  <span className="text-sm font-bold text-green-500">
                                    +{sellPrice.toLocaleString()}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleSellItem(item)}
                                  disabled={item.equipped}
                                  data-testid={`button-sell-item-${item.id}`}
                                >
                                  Sell
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sellableMaterials.length === 0 && craftedItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-[hsl(45_20%_55%)] py-12">
                    <Package className="w-12 h-12 mb-4 opacity-50" />
                    <p>Nothing to sell</p>
                    <p className="text-sm">Gather materials or craft items first!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="h-full m-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[hsl(45_20%_55%)]">
                  <History className="w-12 h-12 mb-4 opacity-50" />
                  <p>No transaction history</p>
                  <p className="text-sm">Your trades will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx: any) => (
                    <Card key={tx.id} className="fantasy-panel border border-[hsl(43_40%_25%)]">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {tx.transactionType === "buy" ? (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium text-[hsl(45_30%_80%)]">
                              {tx.transactionType === "buy" ? "Bought" : "Sold"} {tx.itemName}
                            </p>
                            <p className="text-xs text-[hsl(45_20%_50%)]">
                              {tx.quantity}x • {tx.itemCategory}
                              {tx.tier && ` • T${tx.tier}`}
                            </p>
                          </div>
                        </div>
                        <div className={`font-bold ${tx.transactionType === "buy" ? "text-red-400" : "text-green-500"}`}>
                          {tx.transactionType === "buy" ? "-" : "+"}{tx.totalPrice.toLocaleString()}
                          <Coins className="w-3 h-3 inline ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
          <DialogHeader>
            <DialogTitle className="gold-text flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {activeTab === "recipes" ? "Buy Recipe" : "Buy Materials"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4">
              {activeTab === "materials" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      data-testid="button-quantity-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold text-[hsl(45_30%_80%)] w-16 text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      data-testid="button-quantity-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[hsl(45_20%_55%)]">Total Cost:</p>
                    <p className="text-xl font-bold text-[hsl(43_85%_55%)]">
                      {(calculatePrice(50, selectedItem.tier) * quantity).toLocaleString()} gold
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "recipes" && (
                <div className="text-center">
                  <p className="text-sm text-[hsl(45_20%_55%)]">Cost:</p>
                  <p className="text-xl font-bold text-[hsl(43_85%_55%)]">
                    {(selectedItem.purchaseCost || 500).toLocaleString()} gold
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={activeTab === "recipes" ? handleBuyRecipe : handleBuyMaterial}
              disabled={
                activeTab === "materials"
                  ? character.gold < calculatePrice(50, selectedItem?.tier || 1) * quantity
                  : character.gold < (selectedItem?.purchaseCost || 500)
              }
              data-testid="button-confirm-buy"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="fantasy-panel border-2 border-[hsl(43_50%_35%)]">
          <DialogHeader>
            <DialogTitle className="gold-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Sell Materials
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.name} (Owned: {selectedItem?.owned})
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  data-testid="button-sell-quantity-decrease"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold text-[hsl(45_30%_80%)] w-16 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(selectedItem.owned, quantity + 1))}
                  data-testid="button-sell-quantity-increase"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center">
                <p className="text-sm text-[hsl(45_20%_55%)]">You will receive:</p>
                <p className="text-xl font-bold text-green-500">
                  +{(calculateSellPrice(calculatePrice(50, selectedItem.tier)) * quantity).toLocaleString()} gold
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSellMaterial}
              disabled={quantity > (selectedItem?.owned || 0)}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-sell"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Sell
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
