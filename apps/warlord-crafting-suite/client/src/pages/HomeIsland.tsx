/**
 * Home Island Page
 * 
 * First-time visitors see cutscene + camp placement.
 * Returning visitors go directly to island management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PhaserCanvas } from '@/components/game/PhaserCanvas';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCharacter } from '@/contexts/CharacterContext';
import { Tent, Home, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import type { Island } from '@shared/schema';
import type { Building } from '@/game/homeIsland/IslandScene';

interface IslandResponse {
  island: Island | null;
  hasHomeIsland: boolean;
  isNew: boolean;
}

export default function HomeIslandPage() {
  const { character } = useCharacter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [campPosition, setCampPosition] = useState<{ x: number; y: number } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [islandConfig, setIslandConfig] = useState<any>(null);
  
  const { data: islandData, isLoading, error } = useQuery<IslandResponse>({
    queryKey: ['/api/home-island', character?.id],
    queryFn: async () => {
      const res = await fetch(`/api/home-island?characterId=${character?.id || ''}`);
      if (!res.ok) throw new Error('Failed to load island');
      return res.json();
    },
    enabled: !!character?.id,
  });
  
  const confirmCampMutation = useMutation({
    mutationFn: async (data: { campPosition: { x: number; y: number } }) => {
      const res = await fetch('/api/home-island/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character?.id,
          islandName: `${character?.name}'s Island`,
          campPosition: data.campPosition,
          seed: islandConfig?.seed || Date.now(),
          width: islandConfig?.width || 130,
          height: islandConfig?.height || 105,
        }),
      });
      if (!res.ok) throw new Error('Failed to save island');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/home-island'] });
      toast({
        title: 'Home Island Created!',
        description: 'Your camp has been placed. Welcome home!',
      });
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save your island. Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (islandData?.island) {
      setIslandConfig({
        seed: islandData.island.seed || Date.now(),
        width: islandData.island.width || 130,
        height: islandData.island.height || 105,
        terrain: islandData.island.terrain as number[][] || undefined,
        buildings: islandData.island.buildings as Building[] || [],
        campPosition: islandData.island.campPosition as { x: number; y: number } || undefined,
        harvestNodes: islandData.island.harvestNodes as any[] || undefined,
      });
    } else if (!islandData?.hasHomeIsland) {
      const seed = Date.now() + Math.floor(Math.random() * 1000000);
      setIslandConfig({
        seed,
        width: 120 + Math.floor(Math.random() * 11),
        height: 100 + Math.floor(Math.random() * 6),
      });
    }
  }, [islandData]);

  const handleCampPlaced = useCallback((position: { x: number; y: number }) => {
    setCampPosition(position);
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmCamp = useCallback(() => {
    if (!campPosition) return;
    
    confirmCampMutation.mutate({
      campPosition,
    });
  }, [campPosition, confirmCampMutation]);

  const handleSaveRequested = useCallback(() => {
    toast({
      title: 'Island Saved',
      description: 'Your progress has been saved.',
    });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-400 font-bold text-lg">Loading Home Island...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-8">
        <p className="text-red-400 text-lg mb-4">Failed to load island data</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isCutsceneMode = !islandData?.hasHomeIsland;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-amber-900/30 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center gap-3">
          <Home className="w-6 h-6 text-amber-500" />
          <div>
            <h1 className="text-lg font-bold text-white">
              {isCutsceneMode ? 'Welcome to Your New Island!' : `${character?.name}'s Home Island`}
            </h1>
            <p className="text-xs text-slate-400">
              {isCutsceneMode 
                ? 'Choose where to place your camp to begin your adventure'
                : 'Manage your base, harvest resources, and build your empire'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isCutsceneMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveRequested}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              data-testid="button-save-island"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 relative">
        {islandConfig && (
          <PhaserCanvas
            config={islandConfig}
            cutsceneMode={isCutsceneMode}
            onCampPlaced={handleCampPlaced}
            onSaveRequested={handleSaveRequested}
            className="w-full h-full"
          />
        )}

        {isCutsceneMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400">
              <Tent className="w-5 h-5" />
              <span className="text-sm font-bold">Click on a green area to place your Camp!</span>
            </div>
          </div>
        )}

        {!isCutsceneMode && (
          <div className="absolute bottom-4 left-4 flex gap-2 bg-slate-900/90 backdrop-blur-sm rounded-lg p-2 border border-white/10">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              data-testid="button-building-house"
            >
              🏠 House (1)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              data-testid="button-building-tower"
            >
              🗼 Tower (2)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              data-testid="button-building-farm"
            >
              🌾 Farm (3)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              data-testid="button-building-market"
            >
              🏪 Market (4)
            </Button>
          </div>
        )}
      </div>

      {showConfirmDialog && campPosition && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <Tent className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Confirm Camp Location</h2>
              <p className="text-slate-400 mb-4">
                Place your camp at coordinates ({campPosition.x}, {campPosition.y})?
                This will be your home base for all your adventures!
              </p>
              <p className="text-sm text-amber-400 mb-6">
                💡 This is free and marks the beginning of your island journey!
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setCampPosition(null);
                  }}
                  className="border-slate-600"
                  data-testid="button-cancel-camp"
                >
                  Choose Different Spot
                </Button>
                <Button
                  onClick={handleConfirmCamp}
                  disabled={confirmCampMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                  data-testid="button-confirm-camp"
                >
                  {confirmCampMutation.isPending ? 'Saving...' : 'Confirm Camp!'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
