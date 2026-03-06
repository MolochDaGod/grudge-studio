/**
 * Magical Skill Tree Component
 * 
 * Interactive skill tree with magical animations on node collection.
 * Features sparkle effects, swooping animations, and collection tray.
 */

import { useState, useRef, useCallback, memo } from "react";
import { TreeNode, CraftingBonus, CraftingBonusType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Lock, Unlock, Sparkles } from "lucide-react";
import { useSkillTreeController } from "@/contexts/SkillTreeContext";
import { SparkleEffect, MagicalFume, SwoopingNode, GlowEffect } from "./MagicalAnimations";

const bonusLabels: Record<CraftingBonusType, string> = {
  qualityBoost: "Quality Boost",
  successChance: "Success Rate",
  materialReduction: "Material Cost",
  speedBoost: "Crafting Speed",
  tierUnlock: "Tier Unlock",
  doubleYield: "Double Yield",
  socketChance: "Socket Chance",
  enchantPower: "Enchant Power",
  essenceEfficiency: "Essence Efficiency",
  gemQuality: "Gem Quality"
};

const bonusIcons: Record<CraftingBonusType, string> = {
  qualityBoost: "✨",
  successChance: "🎯",
  materialReduction: "📦",
  speedBoost: "⚡",
  tierUnlock: "🔓",
  doubleYield: "×2",
  socketChance: "💎",
  enchantPower: "🔮",
  essenceEfficiency: "💫",
  gemQuality: "💠"
};

function formatBonus(bonus: CraftingBonus): string {
  const prefix = bonus.type === 'materialReduction' ? '-' : '+';
  const suffix = bonus.type === 'tierUnlock' ? '' : '%';
  const target = bonus.target ? ` (${bonus.target})` : '';
  return `${prefix}${bonus.value}${suffix}${target}`;
}

function getNodeShape(nodeType?: string): 'circle' | 'star' | 'diamond' | 'hexagon' {
  switch (nodeType) {
    case 'recipe': return 'diamond';
    case 'combat': return 'hexagon';
    case 'effect': return 'star';
    default: return 'circle';
  }
}

function getShapeClass(shape: string): string {
  switch (shape) {
    case 'diamond': return 'rotate-45 rounded-sm';
    case 'hexagon': return 'rounded-lg';
    case 'star': return 'rounded-full';
    default: return 'rounded-full';
  }
}

interface SkillTreeProps {
  nodes: TreeNode[];
  currentLevel: number;
  colorClass?: string;
  profession?: string;
}

interface NodeItemProps {
  node: TreeNode;
  isUnlocked: boolean;
  isCollected: boolean;
  isAnimating: boolean;
  colorClass: string;
  profession: string;
  onNodeClick: (node: TreeNode, element: HTMLElement | null) => void;
}

const NodeItem = memo(function NodeItem({
  node,
  isUnlocked,
  isCollected,
  isAnimating,
  colorClass,
  profession,
  onNodeClick,
}: NodeItemProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const shape = getNodeShape(node.nodeType);
  const shapeClass = getShapeClass(shape);

  const handleClick = useCallback(() => {
    if (isUnlocked) {
      onNodeClick(node, nodeRef.current);
    }
  }, [isUnlocked, node, onNodeClick]);

  return (
    <div
      ref={nodeRef}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      data-testid={`skill-node-${node.id}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <AnimatePresence>
        {showTooltip && !isAnimating && (
          <motion.div 
            className="absolute left-1/2 -translate-x-1/2 w-64 bg-slate-950/95 border border-white/20 rounded-lg p-3 shadow-2xl backdrop-blur-sm pointer-events-none"
            style={{ bottom: 'calc(100% + 12px)' }}
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {node.branch && (
              <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                {node.branch} Constellation
              </div>
            )}
            <div className={cn("text-sm font-bold mb-1", isUnlocked ? colorClass : "text-slate-400")}>
              {node.n}
            </div>
            {node.desc && (
              <div className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                {node.desc}
              </div>
            )}
            <div className="text-[10px] text-slate-500 mb-2">
              Requires Level {node.req}
            </div>
            
            {node.bonuses && node.bonuses.length > 0 && (
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="text-[9px] uppercase tracking-wider text-emerald-500 mb-1">Bonuses</div>
                {node.bonuses.map((bonus, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <span>{bonusIcons[bonus.type]}</span>
                    <span className="text-slate-300">{bonusLabels[bonus.type]}:</span>
                    <span className="font-bold">{formatBonus(bonus)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {node.unlocks && node.unlocks.length > 0 && (
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="text-[9px] uppercase tracking-wider text-amber-500 mb-1">Unlocks</div>
                <div className="flex flex-wrap gap-1">
                  {node.unlocks.map((item, i) => (
                    <span key={i} className="text-[9px] bg-amber-900/30 text-amber-300 px-1.5 py-0.5 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {isUnlocked && !isCollected && (
              <div className="text-[10px] text-amber-400 mt-2 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Click to collect!
              </div>
            )}
            
            {isCollected && (
              <div className="text-[10px] text-emerald-400 mt-2 font-bold">✓ Collected</div>
            )}
            
            {!isUnlocked && (
              <div className="text-[10px] text-red-500 mt-2 font-bold">🔒 LOCKED</div>
            )}
            
            <div 
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-slate-950 border-r border-b border-white/20"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <GlowEffect color={isCollected ? '#22c55e' : 'currentColor'} isActive={isAnimating}>
        <motion.div
          className={cn(
            "w-12 h-12 flex items-center justify-center border-2 transition-all duration-300 relative",
            shapeClass,
            isUnlocked 
              ? isCollected
                ? "bg-emerald-900/50 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.5)] cursor-pointer"
                : `bg-slate-900 ${colorClass} border-current shadow-[0_0_15px_currentColor] cursor-pointer hover:scale-110`
              : "bg-slate-950 border-slate-800 text-slate-700 grayscale cursor-not-allowed"
          )}
          whileHover={isUnlocked ? { scale: 1.15 } : {}}
          whileTap={isUnlocked ? { scale: 0.95 } : {}}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: Math.random() * 0.3 }}
          onClick={handleClick}
        >
          <div className={cn("text-[10px] font-bold", shape === 'diamond' && "-rotate-45")}>
            {node.req}
          </div>
          
          {isCollected && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Sparkles className={cn("w-4 h-4 text-emerald-400 absolute", shape === 'diamond' && "-rotate-45")} />
            </motion.div>
          )}
        </motion.div>
      </GlowEffect>
      
      <div className={cn(
        "absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/5",
        isUnlocked ? "text-white" : "text-slate-600"
      )}>
        {node.n}
      </div>
    </div>
  );
});

export function SkillTree({ nodes, currentLevel, colorClass = "text-amber-500", profession = "Unknown" }: SkillTreeProps) {
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [activeSparkle, setActiveSparkle] = useState<{ x: number; y: number; color: string } | null>(null);
  const [activeFume, setActiveFume] = useState<{ x: number; y: number; color: string } | null>(null);
  const [swoopingNode, setSwoopingNode] = useState<{
    node: TreeNode;
    startX: number;
    startY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    handleNodeClick: contextHandleNodeClick, 
    isNodeCollected, 
    activeAnimations,
    collectedNodes,
    openNodePanel,
  } = useSkillTreeController();

  const isUnlocked = (req: number) => currentLevel >= req;
  
  const unlockedNodes = nodes.filter(n => isUnlocked(n.req)).sort((a, b) => a.req - b.req);
  const lockedCount = nodes.length - unlockedNodes.length;
  const collectedCount = nodes.filter(n => isNodeCollected(n.id)).length;
  
  const totalBonuses = unlockedNodes.reduce((acc, node) => {
    if (node.bonuses) {
      node.bonuses.forEach(bonus => {
        const key = bonus.type;
        if (!acc[key]) acc[key] = { type: bonus.type, value: 0 };
        acc[key].value += bonus.value;
      });
    }
    return acc;
  }, {} as Record<string, { type: CraftingBonusType; value: number }>);

  const colorHex = colorClass.includes('amber') ? '#f59e0b' 
    : colorClass.includes('emerald') ? '#10b981'
    : colorClass.includes('purple') ? '#a855f7'
    : colorClass.includes('orange') ? '#f97316'
    : colorClass.includes('cyan') ? '#06b6d4'
    : '#f59e0b';

  const handleNodeClick = useCallback(async (node: TreeNode, element: HTMLElement | null) => {
    if (!element || !isUnlocked(node.req)) return;
    
    if (isNodeCollected(node.id)) {
      const collected = collectedNodes.find(n => n.id === node.id && n.profession === profession);
      if (collected) {
        openNodePanel(collected);
      }
      return;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setActiveSparkle({ x: centerX, y: centerY, color: colorHex });
    setActiveFume({ x: centerX, y: centerY, color: colorHex });

    await new Promise(r => setTimeout(r, 600));

    setSwoopingNode({
      node,
      startX: centerX,
      startY: centerY,
    });

    setTimeout(() => {
      contextHandleNodeClick(node, true, profession, colorHex, element);
    }, 1200);

    setTimeout(() => {
      setSwoopingNode(null);
      setActiveSparkle(null);
      setActiveFume(null);
    }, 1800);
  }, [colorHex, profession, contextHandleNodeClick, isNodeCollected, collectedNodes, openNodePanel]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[800px] bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden shadow-inner shadow-black/50"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {nodes.map((node) => {
          if (!node.p) return null;
          const parent = nodes.find(n => n.id === node.p);
          if (!parent) return null;

          const isPathActive = isUnlocked(node.req);
          const isBothCollected = isNodeCollected(node.id) && isNodeCollected(parent.id);
          
          return (
            <motion.line
              key={`line-${node.id}`}
              x1={`${parent.x}%`}
              y1={`${parent.y}%`}
              x2={`${node.x}%`}
              y2={`${node.y}%`}
              stroke="currentColor"
              strokeWidth={isBothCollected ? 3 : 2}
              className={cn(
                "transition-colors duration-500",
                isBothCollected 
                  ? "text-emerald-500" 
                  : isPathActive 
                    ? colorClass 
                    : "text-slate-800"
              )}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          );
        })}
      </svg>

      {nodes.map((node) => (
        <NodeItem
          key={node.id}
          node={node}
          isUnlocked={isUnlocked(node.req)}
          isCollected={isNodeCollected(node.id)}
          isAnimating={activeAnimations.has(node.id)}
          colorClass={colorClass}
          profession={profession}
          onNodeClick={handleNodeClick}
        />
      ))}

      {activeSparkle && (
        <SparkleEffect
          x={activeSparkle.x}
          y={activeSparkle.y}
          color={activeSparkle.color}
          onComplete={() => {}}
        />
      )}

      {activeFume && (
        <MagicalFume
          x={activeFume.x}
          y={activeFume.y}
          color={activeFume.color}
        />
      )}

      {swoopingNode && (
        <SwoopingNode
          startX={swoopingNode.startX}
          startY={swoopingNode.startY}
          endX={window.innerWidth / 2}
          endY={window.innerHeight - 80}
          color={colorHex}
          nodeShape={getNodeShape(swoopingNode.node.nodeType)}
          nodeContent={String(swoopingNode.node.req)}
          onComplete={() => setSwoopingNode(null)}
        />
      )}

      <motion.div 
        className="absolute bottom-4 left-4 z-20 w-72"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        data-testid="unlocked-skills-panel"
      >
        <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          <button 
            onClick={() => setPanelExpanded(!panelExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            data-testid="toggle-unlocked-panel"
          >
            <div className="flex items-center gap-2">
              <Unlock className={cn("w-4 h-4", colorClass)} />
              <span className="text-xs font-bold text-white">Skills</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full bg-current/20", colorClass)}>
                {collectedCount}/{unlockedNodes.length}/{nodes.length}
              </span>
            </div>
            {panelExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {panelExpanded && (
              <motion.div 
                className="p-3 max-h-64 overflow-y-auto"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {Object.keys(totalBonuses).length > 0 && (
                  <div className="mb-3 pb-3 border-b border-white/10">
                    <div className="text-[9px] uppercase tracking-wider text-emerald-500 mb-2">Total Bonuses</div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.values(totalBonuses).map((bonus, i) => (
                        <div key={i} className="flex items-center gap-1 text-[10px]">
                          <span>{bonusIcons[bonus.type]}</span>
                          <span className="text-slate-400 truncate">{bonusLabels[bonus.type]}:</span>
                          <span className="font-bold text-emerald-400">
                            {bonus.type === 'materialReduction' ? '-' : '+'}
                            {bonus.value}
                            {bonus.type === 'tierUnlock' ? '' : '%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {unlockedNodes.length === 0 ? (
                    <div className="text-[11px] text-slate-500 text-center py-2">
                      <Lock className="w-4 h-4 mx-auto mb-1 opacity-50" />
                      No skills unlocked yet
                    </div>
                  ) : (
                    unlockedNodes.slice(0, 8).map((node) => {
                      const collected = isNodeCollected(node.id);
                      return (
                        <div 
                          key={node.id} 
                          className={cn(
                            "flex items-start gap-2 p-1.5 rounded transition-colors",
                            collected 
                              ? "bg-emerald-900/20 border border-emerald-500/20" 
                              : "bg-slate-800/50 hover:bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 flex items-center justify-center text-[8px] font-bold rounded border shrink-0",
                            collected 
                              ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                              : `${colorClass} border-current bg-current/10`
                          )}>
                            {collected ? '✓' : node.req}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-semibold text-white truncate">{node.n}</div>
                            {node.bonuses && node.bonuses.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {node.bonuses.slice(0, 2).map((bonus, i) => (
                                  <span key={i} className="text-[8px] text-emerald-400">
                                    {bonusIcons[bonus.type]} {formatBonus(bonus)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {unlockedNodes.length > 8 && (
                    <div className="text-[10px] text-slate-500 text-center">
                      +{unlockedNodes.length - 8} more...
                    </div>
                  )}
                </div>

                {lockedCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-[10px] text-slate-500">
                    <Lock className="w-3 h-3" />
                    <span>{lockedCount} skills remaining</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
