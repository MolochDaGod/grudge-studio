/**
 * Skill Tree Interaction Context
 * 
 * Manages state for magical skill tree interactions:
 * - Collected nodes registry
 * - Active animations queue
 * - Node ownership tracking
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TreeNode } from '@/lib/types';

export interface CollectedNode {
  id: string | number;
  nodeData: TreeNode;
  profession: string;
  professionColor: string;
  collectedAt: number;
  position: { x: number; y: number };
}

export interface ActiveAnimation {
  nodeId: string | number;
  phase: 'sparkle' | 'glow' | 'swoop' | 'settle' | 'complete';
  startTime: number;
}

interface SkillTreeContextType {
  collectedNodes: CollectedNode[];
  activeAnimations: Map<string | number, ActiveAnimation>;
  selectedNodeForPanel: CollectedNode | null;
  isPanelOpen: boolean;
  
  collectNode: (node: TreeNode, profession: string, professionColor: string, startPosition: { x: number; y: number }) => void;
  isNodeCollected: (nodeId: string | number) => boolean;
  startAnimation: (nodeId: string | number, phase: ActiveAnimation['phase']) => void;
  completeAnimation: (nodeId: string | number) => void;
  openNodePanel: (node: CollectedNode) => void;
  closeNodePanel: () => void;
  getCollectedNodesForProfession: (profession: string) => CollectedNode[];
}

const SkillTreeContext = createContext<SkillTreeContextType | undefined>(undefined);

const STORAGE_KEY = 'grudge_collected_skill_nodes';

function loadCollectedNodes(): CollectedNode[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCollectedNodes(nodes: CollectedNode[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  } catch (e) {
    console.warn('Failed to save collected nodes:', e);
  }
}

export function SkillTreeProvider({ children }: { children: ReactNode }) {
  const [collectedNodes, setCollectedNodes] = useState<CollectedNode[]>(loadCollectedNodes);
  const [activeAnimations, setActiveAnimations] = useState<Map<string | number, ActiveAnimation>>(new Map());
  const [selectedNodeForPanel, setSelectedNodeForPanel] = useState<CollectedNode | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const collectNode = useCallback((
    node: TreeNode, 
    profession: string, 
    professionColor: string,
    startPosition: { x: number; y: number }
  ) => {
    setCollectedNodes(prev => {
      if (prev.some(n => n.id === node.id && n.profession === profession)) {
        return prev;
      }
      
      const newNode: CollectedNode = {
        id: node.id,
        nodeData: node,
        profession,
        professionColor,
        collectedAt: Date.now(),
        position: startPosition,
      };
      
      const updated = [...prev, newNode];
      saveCollectedNodes(updated);
      return updated;
    });
  }, []);

  const isNodeCollected = useCallback((nodeId: string | number) => {
    return collectedNodes.some(n => n.id === nodeId);
  }, [collectedNodes]);

  const startAnimation = useCallback((nodeId: string | number, phase: ActiveAnimation['phase']) => {
    setActiveAnimations(prev => {
      const next = new Map(prev);
      next.set(nodeId, { nodeId, phase, startTime: Date.now() });
      return next;
    });
  }, []);

  const completeAnimation = useCallback((nodeId: string | number) => {
    setActiveAnimations(prev => {
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  const openNodePanel = useCallback((node: CollectedNode) => {
    setSelectedNodeForPanel(node);
    setIsPanelOpen(true);
  }, []);

  const closeNodePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedNodeForPanel(null);
  }, []);

  const getCollectedNodesForProfession = useCallback((profession: string) => {
    return collectedNodes.filter(n => n.profession === profession);
  }, [collectedNodes]);

  return (
    <SkillTreeContext.Provider value={{
      collectedNodes,
      activeAnimations,
      selectedNodeForPanel,
      isPanelOpen,
      collectNode,
      isNodeCollected,
      startAnimation,
      completeAnimation,
      openNodePanel,
      closeNodePanel,
      getCollectedNodesForProfession,
    }}>
      {children}
    </SkillTreeContext.Provider>
  );
}

export function useSkillTree() {
  const context = useContext(SkillTreeContext);
  if (!context) {
    throw new Error('useSkillTree must be used within SkillTreeProvider');
  }
  return context;
}

export function useSkillTreeController() {
  const context = useSkillTree();
  
  const handleNodeClick = useCallback(async (
    node: TreeNode,
    isUnlocked: boolean,
    profession: string,
    professionColor: string,
    nodeElement: HTMLElement | null
  ) => {
    if (!isUnlocked || !nodeElement) return false;
    
    if (context.isNodeCollected(node.id)) {
      const collected = context.collectedNodes.find(n => n.id === node.id && n.profession === profession);
      if (collected) {
        context.openNodePanel(collected);
      }
      return true;
    }
    
    const rect = nodeElement.getBoundingClientRect();
    const startPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    
    context.startAnimation(node.id, 'sparkle');
    
    await new Promise(r => setTimeout(r, 400));
    context.startAnimation(node.id, 'glow');
    
    await new Promise(r => setTimeout(r, 300));
    context.startAnimation(node.id, 'swoop');
    
    await new Promise(r => setTimeout(r, 800));
    context.startAnimation(node.id, 'settle');
    
    context.collectNode(node, profession, professionColor, startPosition);
    
    await new Promise(r => setTimeout(r, 400));
    context.completeAnimation(node.id);
    
    return true;
  }, [context]);

  return {
    ...context,
    handleNodeClick,
  };
}
