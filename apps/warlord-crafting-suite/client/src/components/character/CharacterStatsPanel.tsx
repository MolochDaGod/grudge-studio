/**
 * Character Stats Panel
 * 
 * Displays comprehensive character information from the aggregated stats system.
 * Shows all bonuses, modifiers, and their sources for full transparency.
 */

import { useState } from 'react';
import { useCharacterStats, useCraftingBonuses } from '@/hooks/useCharacterStats';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronUp, 
  Sword, 
  Shield, 
  Heart, 
  Zap,
  Star,
  Sparkles,
  Package,
  TrendingUp,
  Info,
  Utensils,
  Hammer,
  Leaf,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ATTRIBUTE_DEFINITIONS } from '@shared/statCalculator';

import redFoodIcon from '@assets/generated_images/emberwrath_fire_staff_sprite.png';
import blueFoodIcon from '@assets/generated_images/glacial_spire_frost_staff_sprite.png';
import greenFoodIcon from '@assets/generated_images/nature_tome_sprite.png';

type TabId = 'overview' | 'attributes' | 'combat' | 'crafting' | 'buffs' | 'breakdown';

export function CharacterStatsPanel() {
  const { state, formatStat, getStatName, getStatIcon } = useCharacterStats();
  const { bonuses, bonusTypes } = useCraftingBonuses();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    resources: true,
    combat: true,
    crafting: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!state) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6" data-testid="character-stats-panel-empty">
        <div className="text-center text-slate-400">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No character selected</p>
          <p className="text-xs mt-1">Create or select a character to view stats</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Star className="w-4 h-4" /> },
    { id: 'attributes', label: 'Attributes', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'combat', label: 'Combat', icon: <Sword className="w-4 h-4" /> },
    { id: 'crafting', label: 'Crafting', icon: <Package className="w-4 h-4" /> },
    { id: 'buffs', label: 'Buffs', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'breakdown', label: 'Breakdown', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden" data-testid="character-stats-panel">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-900/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center text-xl">
            {state.avatarUrl ? (
              <img src={state.avatarUrl} alt={state.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              state.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white" data-testid="character-name">{state.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Level {state.level}</span>
              {state.classId && <span className="text-amber-400">{state.classId}</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-amber-400 font-bold" data-testid="character-gold">{state.gold.toLocaleString()} G</div>
            <div className="text-[10px] text-slate-500">
              XP: {state.experience.toLocaleString()} / {(state.experience + state.experienceToNextLevel).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/5 bg-slate-950/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "text-amber-400 border-b-2 border-amber-500 bg-amber-500/5"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Resource Bars */}
            <div className="space-y-2">
              <ResourceBar 
                label="Health" 
                current={state.currentHealth} 
                max={state.maxHealth} 
                color="bg-red-500" 
                icon={<Heart className="w-3 h-3" />}
              />
              <ResourceBar 
                label="Mana" 
                current={state.currentMana} 
                max={state.maxMana} 
                color="bg-blue-500" 
                icon={<Zap className="w-3 h-3" />}
              />
              <ResourceBar 
                label="Stamina" 
                current={state.currentStamina} 
                max={state.maxStamina} 
                color="bg-green-500" 
                icon={<Shield className="w-3 h-3" />}
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Damage" value={state.finalStats.damage} icon="⚔️" />
              <StatCard label="Defense" value={state.finalStats.defense} icon="🛡️" />
              <StatCard label="Crit Chance" value={`${(state.finalStats.criticalChance * 100).toFixed(1)}%`} icon="💥" />
              <StatCard label="Block Chance" value={`${(state.finalStats.blockChance * 100).toFixed(1)}%`} icon="🛡️" />
            </div>

            {/* Attribute Points Summary */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Attribute Points</span>
                <span className="text-sm font-bold text-white">
                  {state.usedAttributePoints} / {state.totalAttributePoints}
                </span>
              </div>
              {state.availableAttributePoints > 0 && (
                <div className="text-xs text-amber-400">
                  {state.availableAttributePoints} points available to spend!
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attributes' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 mb-3">
              Points: {state.usedAttributePoints} / {state.totalAttributePoints} used
              {state.availableAttributePoints > 0 && (
                <span className="text-amber-400 ml-2">({state.availableAttributePoints} available)</span>
              )}
            </div>
            {Object.entries(ATTRIBUTE_DEFINITIONS).map(([key, attr]) => {
              const base = state.baseAttributes[key as keyof typeof state.baseAttributes] || 0;
              const bonus = state.bonusAttributes[key as keyof typeof state.bonusAttributes] || 0;
              const effective = state.effectiveAttributes[key as keyof typeof state.effectiveAttributes] || 0;
              
              return (
                <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{attr.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{attr.name}</div>
                        <div className="text-[10px] text-slate-500">{attr.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: attr.color }}>
                        {base}
                        {bonus > 0 && <span className="text-green-400 text-xs ml-1">+{bonus}</span>}
                      </div>
                      {base !== effective && (
                        <div className="text-[10px] text-slate-500">
                          Effective: {effective.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'combat' && (
          <div className="space-y-3">
            <CollapsibleSection 
              title="Primary Stats" 
              expanded={expandedSections.resources} 
              onToggle={() => toggleSection('resources')}
            >
              <div className="grid grid-cols-2 gap-2">
                <StatRow label="Health" value={state.finalStats.health} icon="❤️" />
                <StatRow label="Mana" value={state.finalStats.mana} icon="💙" />
                <StatRow label="Stamina" value={state.finalStats.stamina} icon="💚" />
                <StatRow label="Damage" value={state.finalStats.damage} icon="⚔️" />
                <StatRow label="Defense" value={state.finalStats.defense} icon="🛡️" />
                <StatRow label="Dmg Reduction" value={`${(state.finalStats.defenseReduction * 100).toFixed(1)}%`} icon="🛡️" />
              </div>
            </CollapsibleSection>

            <CollapsibleSection 
              title="Combat Modifiers" 
              expanded={expandedSections.combat} 
              onToggle={() => toggleSection('combat')}
            >
              <div className="grid grid-cols-2 gap-2">
                <StatRow label="Block Chance" value={`${(state.finalStats.blockChance * 100).toFixed(1)}%`} icon="🛡️" />
                <StatRow label="Block Amount" value={`${(state.finalStats.blockFactor * 100).toFixed(1)}%`} icon="🛡️" />
                <StatRow label="Crit Chance" value={`${(state.finalStats.criticalChance * 100).toFixed(1)}%`} icon="💥" />
                <StatRow label="Crit Damage" value={`${(state.finalStats.criticalFactor * 100).toFixed(0)}%`} icon="💥" />
                <StatRow label="Accuracy" value={`${(state.finalStats.accuracy * 100).toFixed(1)}%`} icon="🎯" />
                <StatRow label="Resistance" value={`${(state.finalStats.resistance * 100).toFixed(1)}%`} icon="✨" />
              </div>
            </CollapsibleSection>

            <CollapsibleSection 
              title="Special Effects" 
              expanded={false} 
              onToggle={() => {}}
            >
              <div className="grid grid-cols-2 gap-2">
                <StatRow label="Life Steal" value={`${(state.finalStats.drainHealth * 100).toFixed(1)}%`} icon="🩸" />
                <StatRow label="Mana Steal" value={`${(state.finalStats.drainMana * 100).toFixed(1)}%`} icon="💧" />
                <StatRow label="Reflect" value={`${(state.finalStats.reflectFactor * 100).toFixed(1)}%`} icon="↩️" />
                <StatRow label="Absorb HP" value={`${(state.finalStats.absorbHealth * 100).toFixed(1)}%`} icon="💖" />
              </div>
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'crafting' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 mb-3">
              Bonuses from profession skill trees
            </div>
            
            {Object.entries(bonusTypes).map(([key, info]) => {
              const value = bonuses[key] || 0;
              if (value === 0) return null;
              
              return (
                <div key={key} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-sm text-white">{info.name}</span>
                  </div>
                  <span className={cn(
                    "font-bold",
                    'isReduction' in info && info.isReduction ? "text-green-400" : "text-emerald-400"
                  )}>
                    {'isReduction' in info && info.isReduction ? '-' : '+'}{value}{info.unit}
                  </span>
                </div>
              );
            })}
            
            {Object.values(bonuses).every(v => v === 0) && (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No crafting bonuses yet</p>
                <p className="text-xs">Unlock profession skills to gain bonuses</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'buffs' && (
          <div className="space-y-4">
            <div className="border-2 border-[hsl(43_40%_25%)] rounded-xl p-4 bg-[hsl(225_28%_10%)]">
              <h4 className="font-bold mb-3 text-[hsl(43_85%_65%)] flex items-center gap-2 text-sm">
                <Utensils className="w-4 h-4" /> Chef Food Buffs
              </h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <FoodSlot color="red" icon={redFoodIcon} label="Red" empty />
                <FoodSlot color="blue" icon={blueFoodIcon} label="Blue" empty />
                <FoodSlot color="green" icon={greenFoodIcon} label="Green" empty />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white border border-amber-400"
                  data-testid="button-eat-food"
                >
                  <Utensils className="w-3 h-3 mr-1" /> Eat
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border border-slate-500"
                  data-testid="button-build"
                >
                  <Hammer className="w-3 h-3 mr-1" /> Build
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-700 hover:bg-green-600 text-white border border-green-500"
                  data-testid="button-auto-harvest"
                >
                  <Leaf className="w-3 h-3 mr-1" /> Auto Harvest
                </Button>
              </div>
            </div>

            <div className="border border-white/10 rounded-xl p-3 bg-slate-900/50">
              <h4 className="font-bold mb-2 text-white flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-purple-400" /> Active Effects
              </h4>
              {state.activeBuffs.length === 0 && state.activePotions.length === 0 ? (
                <div className="text-center py-4 text-slate-500">
                  <p className="text-xs">No active effects</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {state.activeBuffs.map(buff => (
                    <BuffCard key={buff.id} buff={buff} />
                  ))}
                  {state.activePotions.map(potion => (
                    <BuffCard key={potion.id} buff={potion} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 mb-3">
              Detailed breakdown of stat sources ({state.allStatModifiers.length} modifiers)
            </div>
            
            {Object.entries(state.statBreakdown).map(([stat, breakdown]) => {
              if (!breakdown || breakdown.sources.length === 0) return null;
              
              return (
                <div key={stat} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{getStatName(stat)}</span>
                    <span className="font-bold text-amber-400">{formatStat(stat, breakdown.finalValue)}</span>
                  </div>
                  <div className="space-y-1">
                    {breakdown.sources.map((source, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{source.sourceName}</span>
                        <span className="text-emerald-400">+{source.flatBonus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components

function ResourceBar({ label, current, max, color, icon }: {
  label: string;
  current: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}) {
  const percent = max > 0 ? (current / max) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-300">
          {icon}
          {label}
        </div>
        <span className="text-white font-medium">{current} / {max}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-[10px] text-slate-400">{label}</div>
        <div className="text-sm font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
      <div className="flex items-center gap-1.5 text-xs text-slate-300">
        <span>{icon}</span>
        {label}
      </div>
      <span className="text-xs font-medium text-white">{value}</span>
    </div>
  );
}

function CollapsibleSection({ title, expanded, onToggle, children }: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/30 rounded-lg overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-sm font-medium text-white">{title}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {expanded && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function BuffCard({ buff }: { buff: { id: string; name: string; icon?: string; expiresAt: number } }) {
  const remainingMs = buff.expiresAt - Date.now();
  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  
  return (
    <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
      <span className="text-lg">{buff.icon || '✨'}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{buff.name}</div>
        <div className="text-xs text-slate-400">
          {remainingMs > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')} remaining` : 'Expired'}
        </div>
      </div>
    </div>
  );
}

function FoodSlot({ color, icon, label, empty }: { 
  color: 'red' | 'blue' | 'green'; 
  icon: string; 
  label: string; 
  empty?: boolean;
}) {
  const colorClasses = {
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
    blue: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    green: 'border-green-500/30 bg-green-500/5 text-green-400',
  };
  
  return (
    <div 
      className={cn(
        "p-3 border-2 rounded-lg flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity",
        colorClasses[color]
      )}
      data-testid={`food-slot-${color}`}
    >
      <img 
        src={icon} 
        alt={`${label} Slot`} 
        className={cn("w-8 h-8 object-contain mb-1", empty && "opacity-30")} 
      />
      <div className="text-xs font-bold">{label}</div>
      <span className="text-[10px] text-slate-500">{empty ? 'Empty' : 'Active'}</span>
    </div>
  );
}
