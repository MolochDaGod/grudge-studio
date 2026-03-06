/**
 * Collection Tray Component
 * 
 * Displays collected skill tree nodes at the bottom of the screen.
 * Supports hover tooltips and click to open detail panel.
 */

import { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkillTree } from '@/contexts/SkillTreeContext';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import type { CollectedNode } from '@/contexts/SkillTreeContext';

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

interface NodeTooltipProps {
  node: CollectedNode;
  x: number;
  y: number;
}

const NodeTooltip = memo(function NodeTooltip({ node, x, y }: NodeTooltipProps) {
  const { nodeData, profession, professionColor } = node;
  
  return (
    <motion.div
      className="fixed z-[10000] w-64 bg-slate-950/95 border border-white/20 rounded-lg p-3 shadow-2xl backdrop-blur-sm pointer-events-none"
      style={{ 
        left: x,
        top: y - 10,
        transform: 'translate(-50%, -100%)',
      }}
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: professionColor }}>
        {profession} • {nodeData.branch || 'Core'}
      </div>
      <div className="text-sm font-bold text-white mb-1">{nodeData.n}</div>
      {nodeData.desc && (
        <div className="text-[11px] text-slate-300 mb-2 leading-relaxed">{nodeData.desc}</div>
      )}
      
      {nodeData.bonuses && nodeData.bonuses.length > 0 && (
        <div className="border-t border-white/10 pt-2 mt-2">
          <div className="text-[9px] uppercase tracking-wider text-emerald-500 mb-1">Bonuses</div>
          {nodeData.bonuses.map((bonus: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span>{bonusIcons[bonus.type] || '📊'}</span>
              <span className="text-slate-300">{bonus.type}:</span>
              <span className="font-bold">+{bonus.value}%</span>
              {bonus.target && <span className="text-slate-500">({bonus.target})</span>}
            </div>
          ))}
        </div>
      )}
      
      {nodeData.unlocks && nodeData.unlocks.length > 0 && (
        <div className="border-t border-white/10 pt-2 mt-2">
          <div className="text-[9px] uppercase tracking-wider text-amber-500 mb-1">Unlocks</div>
          <div className="flex flex-wrap gap-1">
            {nodeData.unlocks.slice(0, 3).map((item: string, i: number) => (
              <span key={i} className="text-[9px] bg-amber-900/30 text-amber-300 px-1.5 py-0.5 rounded">
                {item}
              </span>
            ))}
            {nodeData.unlocks.length > 3 && (
              <span className="text-[9px] text-slate-500">+{nodeData.unlocks.length - 3} more</span>
            )}
          </div>
        </div>
      )}
      
      <div className="text-[9px] text-slate-500 mt-2 border-t border-white/10 pt-2">
        Click to view full details
      </div>
      
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rotate-45 bg-slate-950 border-r border-b border-white/20"
      />
    </motion.div>
  );
});

interface CollectedNodeItemProps {
  node: CollectedNode;
  index: number;
  onHover: (node: CollectedNode | null, rect: DOMRect | null) => void;
  onClick: (node: CollectedNode) => void;
}

const CollectedNodeItem = memo(function CollectedNodeItem({ 
  node, 
  index, 
  onHover,
  onClick,
}: CollectedNodeItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { nodeData, professionColor } = node;
  
  const shapes: Record<string, string> = {
    stat: 'rounded-full',
    recipe: 'rounded-sm rotate-45',
    effect: 'rounded-lg',
    combat: 'clip-path-hexagon',
  };
  
  const shape = shapes[nodeData.nodeType || 'stat'] || 'rounded-full';

  return (
    <motion.button
      ref={ref}
      className={cn(
        "relative w-10 h-10 flex items-center justify-center border-2 transition-all cursor-pointer",
        "hover:scale-110 hover:z-10",
        shape,
      )}
      style={{
        backgroundColor: `${professionColor}20`,
        borderColor: professionColor,
        boxShadow: `0 0 10px ${professionColor}40`,
      }}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05,
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      whileHover={{ 
        boxShadow: `0 0 20px ${professionColor}80`,
      }}
      onMouseEnter={() => {
        if (ref.current) {
          onHover(node, ref.current.getBoundingClientRect());
        }
      }}
      onMouseLeave={() => onHover(null, null)}
      onClick={() => onClick(node)}
      data-testid={`collected-node-${node.id}`}
    >
      <span 
        className={cn("text-[10px] font-bold", nodeData.nodeType === 'recipe' && '-rotate-45')}
        style={{ color: professionColor }}
      >
        {nodeData.req}
      </span>
      
      <motion.div
        className="absolute inset-0 rounded-full opacity-0"
        style={{
          background: `radial-gradient(circle, ${professionColor}40, transparent)`,
        }}
        whileHover={{ opacity: 1 }}
      />
    </motion.button>
  );
});

export function CollectionTray() {
  const { collectedNodes, openNodePanel } = useSkillTree();
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<{ node: CollectedNode; rect: DOMRect } | null>(null);

  const handleHover = (node: CollectedNode | null, rect: DOMRect | null) => {
    if (node && rect) {
      setHoveredNode({ node, rect });
    } else {
      setHoveredNode(null);
    }
  };

  if (collectedNodes.length === 0) return null;

  const groupedByProfession = collectedNodes.reduce((acc, node) => {
    if (!acc[node.profession]) acc[node.profession] = [];
    acc[node.profession].push(node);
    return acc;
  }, {} as Record<string, CollectedNode[]>);

  return (
    <>
      <AnimatePresence>
        {hoveredNode && (
          <NodeTooltip
            node={hoveredNode.node}
            x={hoveredNode.rect.left + hoveredNode.rect.width / 2}
            y={hoveredNode.rect.top}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-t-xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              data-testid="toggle-collection-tray"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Collected Skills</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  {collectedNodes.length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="px-4 py-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-3">
                    {Object.entries(groupedByProfession).map(([profession, nodes]) => (
                      <div key={profession}>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                          {profession} ({nodes.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {nodes.map((node, i) => (
                            <CollectedNodeItem
                              key={`${node.profession}-${node.id}`}
                              node={node}
                              index={i}
                              onHover={handleHover}
                              onClick={openNodePanel}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
