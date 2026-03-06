/**
 * Phaser Canvas Wrapper Component
 * 
 * React component that embeds a Phaser game canvas.
 * Handles lifecycle, resize, and cleanup.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { IslandScene, createIslandGameConfig, type IslandConfig, type IslandSceneCallbacks, type Building } from '@/game/homeIsland/IslandScene';

interface PhaserCanvasProps {
  config: IslandConfig;
  cutsceneMode?: boolean;
  onCampPlaced?: (position: { x: number; y: number }) => void;
  onBuildingPlaced?: (building: Building) => void;
  onSaveRequested?: () => void;
  onGameReady?: (game: Phaser.Game) => void;
  className?: string;
}

export function PhaserCanvas({
  config,
  cutsceneMode = false,
  onCampPlaced,
  onBuildingPlaced,
  onSaveRequested,
  onGameReady,
  className = '',
}: PhaserCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const callbacks: IslandSceneCallbacks = {
    onCampPlaced: useCallback((position) => {
      onCampPlaced?.(position);
    }, [onCampPlaced]),
    onBuildingPlaced: useCallback((building) => {
      onBuildingPlaced?.(building);
    }, [onBuildingPlaced]),
    onSaveRequested: useCallback(() => {
      onSaveRequested?.();
    }, [onSaveRequested]),
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const initGame = async () => {
      setIsLoading(true);
      
      try {
        const gameConfig: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: containerRef.current!.clientWidth || 1280,
          height: containerRef.current!.clientHeight || 720,
          parent: containerRef.current!,
          backgroundColor: '#1a4d7a',
          physics: {
            default: 'arcade',
            arcade: { debug: false },
          },
          scene: {
            preload: function(this: Phaser.Scene) {},
            create: function(this: Phaser.Scene) {
              const scene = new IslandScene();
              this.scene.add('IslandScene', scene, true, { 
                config, 
                callbacks, 
                cutsceneMode 
              });
              this.scene.remove('boot');
            },
          },
          render: {
            pixelArt: false,
            antialias: true,
          },
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        };

        const game = new Phaser.Game(gameConfig);
        gameRef.current = game;
        
        game.events.once('ready', () => {
          setIsLoading(false);
          onGameReady?.(game);
        });
        
        setTimeout(() => setIsLoading(false), 1000);
        
      } catch (error) {
        console.error('Failed to initialize Phaser game:', error);
        setIsLoading(false);
      }
    };

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current && containerRef.current) {
        gameRef.current.scale.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full ${className}`}
      data-testid="phaser-canvas-container"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-amber-400 font-bold">Generating Island...</p>
          </div>
        </div>
      )}
    </div>
  );
}
