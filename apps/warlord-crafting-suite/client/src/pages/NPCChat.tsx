import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  createNPC, 
  loadNPC, 
  listNPCs, 
  chatWithNPC, 
  getDefaultNPCs,
  NPCMemory 
} from '@/lib/npcAgent';
import { useCharacter } from '@/contexts/CharacterContext';
import type { Character } from '@shared/schema';
import { Send, Bot, Loader2, Users, MessageCircle, Heart, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'player' | 'npc';
  content: string;
  timestamp: Date;
}

export default function NPCChat() {
  const { character } = useCharacter();
  const [npcs, setNPCs] = useState<NPCMemory[]>([]);
  const [selectedNPC, setSelectedNPC] = useState<NPCMemory | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNPCsAsync();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadNPCsAsync = async () => {
    setIsLoading(true);
    try {
      const npcIds = await listNPCs();
      const loadedNPCs: NPCMemory[] = [];
      
      for (const id of npcIds) {
        const npc = await loadNPC(id);
        if (npc) loadedNPCs.push(npc);
      }
      
      if (loadedNPCs.length === 0) {
        const defaults = getDefaultNPCs();
        for (const def of defaults.slice(0, 3)) {
          const npc = await createNPC(def.name, def.role);
          loadedNPCs.push(npc);
        }
      }
      
      setNPCs(loadedNPCs);
      if (loadedNPCs.length > 0 && !selectedNPC) {
        selectNPC(loadedNPCs[0]);
      }
    } catch (error) {
      console.error('Failed to load NPCs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectNPC = (npc: NPCMemory) => {
    setSelectedNPC(npc);
    const history = npc.conversationHistory.slice(-20).map((entry, idx) => ([
      { id: `h-p-${idx}`, sender: 'player' as const, content: entry.playerMessage, timestamp: new Date(entry.timestamp) },
      { id: `h-n-${idx}`, sender: 'npc' as const, content: entry.npcResponse, timestamp: new Date(entry.timestamp) }
    ])).flat();
    setMessages(history);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedNPC || isSending) return;

    const playerMessage = input.trim();
    setInput('');
    setIsSending(true);

    const playerMsg: ChatMessage = {
      id: `p-${Date.now()}`,
      sender: 'player',
      content: playerMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, playerMsg]);

    try {
      const playerId = character?.id || 'guest';
      const playerName = character?.name || 'Traveler';
      
      const { response, updatedNPC } = await chatWithNPC(
        selectedNPC,
        playerMessage,
        playerId,
        playerName
      );

      const npcMsg: ChatMessage = {
        id: `n-${Date.now()}`,
        sender: 'npc',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, npcMsg]);
      setSelectedNPC(updatedNPC);
      
      setNPCs(prev => prev.map(n => n.id === updatedNPC.id ? updatedNPC : n));
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'npc',
        content: '*The NPC seems momentarily confused*',
        timestamp: new Date(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const getMoodEmoji = (mood: NPCMemory['mood']) => {
    const moods = { friendly: '😊', neutral: '😐', suspicious: '🤨', excited: '🤩', tired: '😴' };
    return moods[mood] || '😐';
  };

  const getRoleIcon = (role: NPCMemory['role']) => {
    const icons = {
      shopkeeper: '🏪',
      quest_giver: '📜',
      crafter: '⚒️',
      guide: '🗺️',
      merchant: '💰',
    };
    return icons[role] || '👤';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl" data-testid="npc-chat-page">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-amber-500" />
              NPCs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-2">
                {npcs.map(npc => (
                  <button
                    key={npc.id}
                    onClick={() => selectNPC(npc)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedNPC?.id === npc.id
                        ? 'bg-amber-500/20 border border-amber-500/50'
                        : 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-transparent'
                    }`}
                    data-testid={`npc-select-${npc.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-lg">
                          {getRoleIcon(npc.role)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{npc.name}</span>
                          <span>{getMoodEmoji(npc.mood)}</span>
                        </div>
                        <div className="text-xs text-zinc-400 capitalize">{npc.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 flex flex-col">
          {selectedNPC ? (
            <>
              <CardHeader className="pb-2 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-xl bg-amber-500/20">
                        {getRoleIcon(selectedNPC.role)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedNPC.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {selectedNPC.role.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getMoodEmoji(selectedNPC.mood)} {selectedNPC.mood}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          {selectedNPC.interactionCount} chats
                        </span>
                      </div>
                    </div>
                  </div>
                  <Tabs defaultValue="chat" className="w-auto">
                    <TabsList className="h-8">
                      <TabsTrigger value="chat" className="text-xs px-2">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Chat
                      </TabsTrigger>
                      <TabsTrigger value="info" className="text-xs px-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Info
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-zinc-500 py-8">
                        <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Start a conversation with {selectedNPC.name}</p>
                      </div>
                    )}
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'npc' && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-sm bg-amber-500/20">
                              {getRoleIcon(selectedNPC.role)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender === 'player'
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-800 text-zinc-100'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-[10px] opacity-50 block mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {msg.sender === 'player' && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-sm bg-blue-500/20">
                              {character?.name?.[0] || 'P'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm bg-amber-500/20">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-zinc-800 rounded-lg px-4 py-2">
                          <p className="text-sm text-zinc-400">Thinking...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2 p-4 border-t border-zinc-800"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Talk to ${selectedNPC.name}...`}
                    disabled={isSending}
                    className="flex-1"
                    data-testid="npc-chat-input"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSending || !input.trim()}
                    data-testid="npc-send-btn"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-zinc-500">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Select an NPC to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
