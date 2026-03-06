import { useState } from "react";
import { mysticData } from "@/data/mystic";
import { TreeVisualizer } from "@/components/profession/TreeVisualizer";
import { CraftingInterface } from "@/components/profession/CraftingInterface";
import { UpgradeInterface } from "@/components/profession/UpgradeInterface";
import { ActivitiesPanel } from "@/components/profession/ActivitiesPanel";
import mysticIcon from '@assets/generated_images/mystic_profession_game_icon.png';

type TabValue = "tree" | "craft" | "upgrade" | "activities";

export default function MysticPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("tree");

  const tabs: { value: TabValue; label: string }[] = [
    { value: "tree", label: "Astral Tree" },
    { value: "craft", label: "Conduit" },
    { value: "upgrade", label: "Enchant" },
    { value: "activities", label: "XP" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center gap-3 px-4 py-2 border-b-2 border-[hsl(43_50%_30%)] bg-gradient-to-b from-[hsl(225_25%_16%)] to-[hsl(225_28%_12%)]">
        <div className="flex items-center gap-3">
          <img src={mysticIcon} alt="Mystic" className="w-10 h-10 md:w-12 md:h-12 rounded-lg" />
          <div>
            <h1 className="text-xl md:text-2xl font-uncial text-purple-400 leading-none">Arch-Mystic</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] mt-0.5">Mystic Specialization</p>
          </div>
        </div>
        
        <div className="flex bg-slate-900/50 border border-white/10 rounded-lg p-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 md:px-5 py-1.5 font-bold tracking-wider uppercase text-[10px] rounded-md transition-all ${
                activeTab === tab.value
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
              data-testid={`tab-${tab.value}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "tree" && (
          <TreeVisualizer 
            nodes={mysticData.treeData} 
            color={mysticData.color} 
            bgImage={mysticData.bgImage} 
            profession="Mystic" 
            fullscreen 
          />
        )}
        {activeTab === "craft" && (
          <div className="h-full overflow-auto p-4">
            <CraftingInterface data={mysticData} />
          </div>
        )}
        {activeTab === "upgrade" && (
          <div className="h-full overflow-auto p-4">
            <UpgradeInterface data={mysticData} />
          </div>
        )}
        {activeTab === "activities" && (
          <div className="h-full overflow-auto p-4">
            <ActivitiesPanel profession="mystic" accentColor="purple" />
          </div>
        )}
      </div>
    </div>
  );
}
