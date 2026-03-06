/**
 * NPC Intelligence Agent
 * AI-powered NPCs with KV state memory for organic growth and learning
 */

import { isPuterAvailable, getPuter } from './puter';
import { WORKER_URL } from './puterSprites';

export interface NPCMemory {
  id: string;
  name: string;
  personality: string;
  role: 'shopkeeper' | 'quest_giver' | 'crafter' | 'guide' | 'merchant';
  createdAt: string;
  lastInteraction: string;
  interactionCount: number;
  knowledgeBase: string[];
  conversationHistory: ConversationEntry[];
  playerRelationships: Record<string, PlayerRelationship>;
  mood: 'friendly' | 'neutral' | 'suspicious' | 'excited' | 'tired';
  stats: NPCStats;
}

export interface ConversationEntry {
  timestamp: string;
  playerMessage: string;
  npcResponse: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface PlayerRelationship {
  playerId: string;
  playerName: string;
  trustLevel: number;
  tradingHistory: number;
  questsCompleted: number;
  lastSeen: string;
}

export interface NPCStats {
  totalTrades: number;
  totalGoldExchanged: number;
  questsGiven: number;
  craftingHelp: number;
  secrets_revealed: number;
}

const NPC_STORAGE_PREFIX = 'grudge_npc_';
const NPC_INDEX_KEY = 'grudge_npc_index';

const NPC_PERSONALITIES: Record<string, string> = {
  shopkeeper: `You are a friendly but shrewd shopkeeper in the GRUDGE Warlords fantasy world. You know a lot about item values, crafting materials, and market trends. You're helpful but always try to make good trades. You speak in a warm, merchant-like manner.`,
  quest_giver: `You are a mysterious quest giver in GRUDGE Warlords. You have knowledge of dangerous dungeons, rare materials, and hidden treasures. You speak cryptically and reward brave adventurers who complete your challenges.`,
  crafter: `You are a master crafter in GRUDGE Warlords with expertise in all five professions: Mining, Forestry, Mysticism, Cooking, and Engineering. You love discussing crafting techniques, recipe secrets, and material properties. You're enthusiastic about helping players improve their skills.`,
  guide: `You are a helpful guide in GRUDGE Warlords who knows everything about the game's systems. You explain crafting, progression, combat, and class abilities clearly. You're patient and encouraging with new players.`,
  merchant: `You are a traveling merchant in GRUDGE Warlords who has seen many lands. You trade in exotic materials and rare recipes. You share stories of distant regions and offer unique items that can't be found elsewhere.`,
};

export async function createNPC(
  name: string,
  role: NPCMemory['role'],
  customPersonality?: string
): Promise<NPCMemory> {
  const npc: NPCMemory = {
    id: `npc_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    name,
    personality: customPersonality || NPC_PERSONALITIES[role] || NPC_PERSONALITIES.guide,
    role,
    createdAt: new Date().toISOString(),
    lastInteraction: new Date().toISOString(),
    interactionCount: 0,
    knowledgeBase: getDefaultKnowledge(role),
    conversationHistory: [],
    playerRelationships: {},
    mood: 'friendly',
    stats: {
      totalTrades: 0,
      totalGoldExchanged: 0,
      questsGiven: 0,
      craftingHelp: 0,
      secrets_revealed: 0,
    },
  };

  await saveNPC(npc);
  return npc;
}

function getDefaultKnowledge(role: NPCMemory['role']): string[] {
  const baseKnowledge = [
    'GRUDGE Warlords is a fantasy crafting game with 4 classes: Warrior, Worg, Mage, Ranger',
    '5 professions: Miner, Forester, Mystic, Chef, Engineer',
    'Items have tiers from T1 (basic) to T8 (legendary)',
    'Characters level from 0 to 20',
    'Professions level from 0 to 100',
  ];

  const roleKnowledge: Record<string, string[]> = {
    shopkeeper: [
      'I know the fair prices for all materials and items',
      'Rare essences are worth more than common ores',
      'T8 items are extremely valuable and sought after',
    ],
    quest_giver: [
      'I know secret locations with rare materials',
      'Dangerous dungeons yield the best rewards',
      'Only the bravest adventurers complete my hardest quests',
    ],
    crafter: [
      'Mining gives copper, iron, gold, silver, starmetal, and more',
      'Forestry provides different wood types for planks',
      'Mystic essences power magical enchantments',
      'Chef recipes provide powerful buffs',
      'Engineering creates gadgets and tools',
    ],
    guide: [
      'I can explain any game system in detail',
      'New players should start with Miner profession',
      'Each class has unique skills in their skill tree',
    ],
    merchant: [
      'I travel between regions trading exotic goods',
      'Rare recipes can only be found from special sources',
      'I sometimes have limited stock of legendary items',
    ],
  };

  return [...baseKnowledge, ...(roleKnowledge[role] || [])];
}

export async function saveNPC(npc: NPCMemory): Promise<void> {
  const key = `${NPC_STORAGE_PREFIX}${npc.id}`;
  
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      await puter.kv.set(key, JSON.stringify(npc));
      
      const indexStr = await puter.kv.get(NPC_INDEX_KEY) as string | null;
      const index: string[] = indexStr ? JSON.parse(indexStr) : [];
      if (!index.includes(npc.id)) {
        index.push(npc.id);
        await puter.kv.set(NPC_INDEX_KEY, JSON.stringify(index));
      }
      return;
    } catch (error) {
      console.error('Failed to save NPC to Puter KV:', error);
    }
  }
  
  localStorage.setItem(key, JSON.stringify(npc));
  const indexStr = localStorage.getItem(NPC_INDEX_KEY);
  const index: string[] = indexStr ? JSON.parse(indexStr) : [];
  if (!index.includes(npc.id)) {
    index.push(npc.id);
    localStorage.setItem(NPC_INDEX_KEY, JSON.stringify(index));
  }
}

export async function loadNPC(npcId: string): Promise<NPCMemory | null> {
  const key = `${NPC_STORAGE_PREFIX}${npcId}`;
  
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const npcStr = await puter.kv.get(key) as string | null;
      if (npcStr) {
        return JSON.parse(npcStr) as NPCMemory;
      }
      return null;
    } catch (error) {
      console.error('Failed to load NPC from Puter KV:', error);
    }
  }
  
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}

export async function listNPCs(): Promise<string[]> {
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const indexStr = await puter.kv.get(NPC_INDEX_KEY) as string | null;
      return indexStr ? JSON.parse(indexStr) : [];
    } catch (error) {
      console.error('Failed to list NPCs:', error);
      return [];
    }
  }
  
  const indexStr = localStorage.getItem(NPC_INDEX_KEY);
  return indexStr ? JSON.parse(indexStr) : [];
}

export async function chatWithNPC(
  npc: NPCMemory,
  playerMessage: string,
  playerId: string,
  playerName: string
): Promise<{ response: string; updatedNPC: NPCMemory }> {
  const recentHistory = npc.conversationHistory.slice(-5);
  const historyContext = recentHistory
    .map(entry => `Player: ${entry.playerMessage}\n${npc.name}: ${entry.npcResponse}`)
    .join('\n\n');

  const relationship = npc.playerRelationships[playerId];
  const relationshipContext = relationship
    ? `You've met ${playerName} before (trust level: ${relationship.trustLevel}/100, trades: ${relationship.tradingHistory}).`
    : `This is your first time meeting ${playerName}.`;

  const systemPrompt = `${npc.personality}

Your name is ${npc.name}. You are a ${npc.role} NPC.

Current mood: ${npc.mood}
${relationshipContext}

Things you know:
${npc.knowledgeBase.map(k => `- ${k}`).join('\n')}

Recent conversation history:
${historyContext || '(No recent history)'}

Respond in character. Keep responses concise (1-3 sentences). Express your personality. If asked about something you don't know, stay in character and make something up that fits the game world.`;

  try {
    let responseText: string;

    if (isPuterAvailable()) {
      const puter = getPuter();
      const response = await puter.ai.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${playerName} says: "${playerMessage}"` }
      ], { model: 'gpt-4o-mini', temperature: 0.8 });
      
      responseText = typeof response === 'object' && 'message' in response
        ? (response.message as { content: string }).content
        : String(response);
    } else {
      try {
        const res = await fetch(`${WORKER_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt,
            messages: [{ role: 'user', content: `${playerName} says: "${playerMessage}"` }],
            model: 'gpt-4o-mini'
          })
        });
        const data = await res.json();
        responseText = data.response?.message?.content || data.response || 'I... I seem to have lost my train of thought.';
      } catch {
        responseText = `*${npc.name} looks at you thoughtfully* I'm not sure how to respond to that right now.`;
      }
    }

    const sentiment = detectSentiment(playerMessage, responseText);
    
    const updatedNPC: NPCMemory = {
      ...npc,
      lastInteraction: new Date().toISOString(),
      interactionCount: npc.interactionCount + 1,
      conversationHistory: [
        ...npc.conversationHistory.slice(-19),
        {
          timestamp: new Date().toISOString(),
          playerMessage,
          npcResponse: responseText,
          sentiment,
        }
      ],
      playerRelationships: {
        ...npc.playerRelationships,
        [playerId]: {
          playerId,
          playerName,
          trustLevel: Math.min(100, (relationship?.trustLevel || 0) + (sentiment === 'positive' ? 2 : sentiment === 'negative' ? -1 : 1)),
          tradingHistory: relationship?.tradingHistory || 0,
          questsCompleted: relationship?.questsCompleted || 0,
          lastSeen: new Date().toISOString(),
        }
      },
      mood: updateMood(npc.mood, sentiment),
    };

    await saveNPC(updatedNPC);

    return { response: responseText, updatedNPC };
  } catch (error) {
    console.error('NPC chat error:', error);
    return {
      response: `*${npc.name} seems distracted* Forgive me, my mind wanders...`,
      updatedNPC: npc,
    };
  }
}

function detectSentiment(playerMessage: string, npcResponse: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['thank', 'great', 'awesome', 'love', 'help', 'please', 'friend'];
  const negativeWords = ['hate', 'stupid', 'dumb', 'cheat', 'steal', 'angry', 'annoying'];
  
  const combined = (playerMessage + ' ' + npcResponse).toLowerCase();
  
  const positiveScore = positiveWords.filter(w => combined.includes(w)).length;
  const negativeScore = negativeWords.filter(w => combined.includes(w)).length;
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

function updateMood(currentMood: NPCMemory['mood'], sentiment: 'positive' | 'neutral' | 'negative'): NPCMemory['mood'] {
  const moodTransitions: Record<string, Record<string, NPCMemory['mood']>> = {
    friendly: { positive: 'excited', neutral: 'friendly', negative: 'neutral' },
    neutral: { positive: 'friendly', neutral: 'neutral', negative: 'suspicious' },
    suspicious: { positive: 'neutral', neutral: 'suspicious', negative: 'tired' },
    excited: { positive: 'excited', neutral: 'friendly', negative: 'neutral' },
    tired: { positive: 'neutral', neutral: 'tired', negative: 'suspicious' },
  };
  
  return moodTransitions[currentMood]?.[sentiment] || currentMood;
}

export function getDefaultNPCs(): Array<{ name: string; role: NPCMemory['role']; description: string }> {
  return [
    { name: 'Grimshaw', role: 'shopkeeper', description: 'The gruff but fair trading post keeper' },
    { name: 'Elder Mystara', role: 'quest_giver', description: 'Ancient seer who sends heroes on dangerous quests' },
    { name: 'Master Forge', role: 'crafter', description: 'Legendary artisan who knows all crafting secrets' },
    { name: 'Scout Pip', role: 'guide', description: 'Cheerful guide who helps new adventurers' },
    { name: 'The Wanderer', role: 'merchant', description: 'Mysterious traveling trader with exotic wares' },
  ];
}
