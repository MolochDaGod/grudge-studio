/**
 * Profession Node Panel
 * 
 * Detailed view of a collected node showing:
 * - Node information and bonuses
 * - Full profession skill tree overview
 * - All collected nodes for this profession
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkillTree } from '@/contexts/SkillTreeContext';
import { cn } from '@/lib/utils';
import { X, Star, Sparkles, ChevronRight, Trophy, Zap } from 'lucide-react';

import { minerData } from '@/data/miner';
import { foresterData } from '@/data/forester';
import { engineerData } from '@/data/engineer';
import { mysticData } from '@/data/mystic';
import { chefData } from '@/data/chef';
import type { ProfessionData, TreeNode, CraftingBonus } from '@/lib/types';

const PROFESSION_DATA: Record<string, ProfessionData> = {
  Miner: minerData,
  Forester: foresterData,
  Engineer: engineerData,
  Mystic: mysticData,
  Chef: chefData,
};

const bonusLabels: Record<string, string> = {
  qualityBoost: 'Quality Boost',
  successChance: 'Success Rate',
  materialReduction: 'Material Cost Reduction',
  speedBoost: 'Crafting Speed',
  tierUnlock: 'Tier Unlock',
  doubleYield: 'Double Yield Chance',
  socketChance: 'Socket Chance',
  enchantPower: 'Enchant Power',
  essenceEfficiency: 'Essence Efficiency',
  gemQuality: 'Gem Quality',
};

const bonusIcons: Record<string, string> = {
  qualityBoost: '✨',
  successChance: '🎯',
  materialReduction: '📦',
  speedBoost: '⚡',
  tierUnlock: '🔓',
  doubleYield: '×2',
  socketChance: '💎',
  enchantPower: '🔮',
  essenceEfficiency: '💫',
  gemQuality: '💠',
};

interface AggregatedBonus {
  type: string;
  total: number;
  sources: { nodeName: string; value: number; target?: string }[];
}

export const ProfessionNodePanel = memo(function ProfessionNodePanel() {
  const { selectedNodeForPanel, isPanelOpen, closeNodePanel, getCollectedNodesForProfession } = useSkillTree();

  const professionData = useMemo(() => {
    if (!selectedNodeForPanel) return null;
    return PROFESSION_DATA[selectedNodeForPanel.profession];
  }, [selectedNodeForPanel]);

  const collectedNodesForProfession = useMemo(() => {
    if (!selectedNodeForPanel) return [];
    return getCollectedNodesForProfession(selectedNodeForPanel.profession);
  }, [selectedNodeForPanel, getCollectedNodesForProfession]);

  const aggregatedBonuses = useMemo(() => {
    const bonusMap: Record<string, AggregatedBonus> = {};
    
    for (const collected of collectedNodesForProfession) {
      const node = collected.nodeData;
      if (!node.bonuses) continue;
      
      for (const bonus of node.bonuses) {
        const key = bonus.target ? `${bonus.type}_${bonus.target}` : bonus.type;
        
        if (!bonusMap[key]) {
          bonusMap[key] = {
            type: bonus.type,
            total: 0,
            sources: [],
          };
        }
        
        bonusMap[key].total += bonus.value;
        bonusMap[key].sources.push({
          nodeName: node.n,
          value: bonus.value,
          target: bonus.target,
        });
      }
    }
    
    return Object.values(bonusMap);
  }, [collectedNodesForProfession]);

  const allUnlocks = useMemo(() => {
    const unlocks: string[] = [];
    for (const collected of collectedNodesForProfession) {
      if (collected.nodeData.unlocks) {
        unlocks.push(...collected.nodeData.unlocks);
      }
    }
    return Array.from(new Set(unlocks));
  }, [collectedNodesForProfession]);

  if (!selectedNodeForPanel || !professionData) return null;

  const { nodeData, profession, professionColor } = selectedNodeForPanel;
  const totalNodes = professionData.treeData.length;
  const collectedCount = collectedNodesForProfession.length;
  const progressPercent = (collectedCount / totalNodes) * 100;

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNodePanel}
          />
          
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl z-[101] overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="h-full flex flex-col">
              <div 
                className="p-4 border-b border-white/10"
                style={{ background: `linear-gradient(135deg, ${professionColor}20, transparent)` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{professionData.icon}</span>
                      <span 
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: professionColor }}
                      >
                        {profession}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{nodeData.n}</h2>
                    {nodeData.branch && (
                      <div className="text-xs text-slate-400 mt-0.5">{nodeData.branch} Branch</div>
                    )}
                  </div>
                  <button
                    onClick={closeNodePanel}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    data-testid="close-node-panel"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-bold" style={{ color: professionColor }}>
                      {collectedCount} / {totalNodes}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: professionColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                    <Star className="w-4 h-4" style={{ color: professionColor }} />
                    Selected Node
                  </h3>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    {nodeData.desc && (
                      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                        {nodeData.desc}
                      </p>
                    )}
                    
                    <div className="text-xs text-slate-500 mb-3">
                      Requires Level {nodeData.req}
                    </div>
                    
                    {nodeData.bonuses && nodeData.bonuses.length > 0 && (
                      <div className="space-y-2">
                        {nodeData.bonuses.map((bonus: CraftingBonus, i: number) => (
                          <div 
                            key={i}
                            className="flex items-center gap-2 p-2 bg-slate-700/50 rounded"
                          >
                            <span className="text-lg">{bonusIcons[bonus.type] || '📊'}</span>
                            <div className="flex-1">
                              <div className="text-xs text-slate-300">
                                {bonusLabels[bonus.type] || bonus.type}
                              </div>
                              {bonus.target && (
                                <div className="text-[10px] text-slate-500">
                                  Target: {bonus.target}
                                </div>
                              )}
                            </div>
                            <span 
                              className="text-sm font-bold"
                              style={{ color: professionColor }}
                            >
                              +{bonus.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {nodeData.unlocks && nodeData.unlocks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-[10px] uppercase tracking-wider text-amber-500 mb-2">
                          Unlocks
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {nodeData.unlocks.map((item: string, i: number) => (
                            <span 
                              key={i}
                              className="text-xs bg-amber-900/30 text-amber-300 px-2 py-1 rounded"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Total Profession Bonuses
                  </h3>
                  
                  {aggregatedBonuses.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      Collect more nodes to see aggregated bonuses
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {aggregatedBonuses.map((bonus, i) => (
                        <motion.div
                          key={i}
                          className="bg-slate-800/50 rounded-lg overflow-hidden"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div className="flex items-center gap-3 p-3">
                            <span className="text-xl">{bonusIcons[bonus.type] || '📊'}</span>
                            <div className="flex-1">
                              <div className="text-sm text-white">
                                {bonusLabels[bonus.type] || bonus.type}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                From {bonus.sources.length} node{bonus.sources.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <span className="text-lg font-bold text-emerald-400">
                              +{bonus.total}%
                            </span>
                          </div>
                          
                          {bonus.sources.length > 1 && (
                            <div className="px-3 pb-3">
                              <div className="bg-slate-900/50 rounded p-2 space-y-1">
                                {bonus.sources.map((source, j) => (
                                  <div key={j} className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-400">{source.nodeName}</span>
                                    <span className="text-emerald-400">+{source.value}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                    <Zap className="w-4 h-4 text-purple-400" />
                    All Unlocked Recipes & Items
                  </h3>
                  
                  {allUnlocks.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No unlocks collected yet
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {allUnlocks.map((unlock, i) => (
                        <motion.span
                          key={i}
                          className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded flex items-center gap-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <ChevronRight className="w-3 h-3" />
                          {unlock}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: professionColor }} />
                    Collected Nodes ({collectedCount})
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {collectedNodesForProfession.map((collected, i) => (
                      <motion.div
                        key={`${collected.profession}-${collected.id}`}
                        className={cn(
                          "p-2 rounded-lg border transition-all cursor-pointer",
                          collected.id === nodeData.id
                            ? "bg-white/10 border-white/30"
                            : "bg-slate-800/50 border-transparent hover:border-white/10"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
                            style={{ 
                              borderColor: professionColor,
                              color: professionColor,
                              backgroundColor: `${professionColor}20`,
                            }}
                          >
                            {collected.nodeData.req}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">
                              {collected.nodeData.n}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {collected.nodeData.branch || 'Core'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
