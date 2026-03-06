import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { isPuterAvailable, getPuter } from '@/lib/puter';
import { WORKER_URL } from '@/lib/puterSprites';
import { Send, Bot, User, Loader2, Zap, Image, Database, MessageSquare, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: CommandAction;
}

interface CommandAction {
  type: 'sprite_generate' | 'sprite_list' | 'kv_get' | 'kv_set' | 'chat' | 'health_check' | 'unknown';
  params?: Record<string, string>;
  result?: unknown;
  status: 'pending' | 'running' | 'success' | 'error';
}

const SYSTEM_PROMPT = `You are the GRUDGE Warlords Command Center AI assistant. You help manage the game studio's operations through natural language commands.

Available commands you can help with:
1. SPRITE GENERATION: "generate a [category] sprite for [item name]" - Creates AI sprites using FLUX model
   Categories: ore, wood, plank, component, essence, gem, leather, sword, axe, bow, staff, dagger, hammer, potion
   
2. SPRITE LISTING: "list sprites" or "show [category] sprites" - Shows sprites in cloud storage

3. HEALTH CHECK: "check worker health" or "worker status" - Checks the sprite worker status

4. KV STORAGE: "get [key]" or "set [key] to [value]" - Manage key-value storage

5. CHAT: Any general question about the game, crafting, or studio operations

When parsing commands, respond with JSON in this format:
{"action": "sprite_generate|sprite_list|health_check|kv_get|kv_set|chat", "params": {...}, "message": "your response"}

For sprite_generate, include: {"category": "...", "name": "...", "id": "..."}
For sprite_list, include: {"category": "all|specific_category"}
For kv_get/kv_set, include: {"key": "...", "value": "..."} 
For chat, just include your helpful response in "message".

Keep responses concise and action-oriented.`;

export default function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to GRUDGE Command Center. I can help you generate sprites, manage cloud storage, and answer questions about the game studio. Try: "generate an ore sprite for iron ore" or "check worker health"',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkWorkerHealth = useCallback(async () => {
    try {
      const res = await fetch(`${WORKER_URL}/api/health`);
      if (res.ok) {
        setWorkerStatus('online');
        return await res.json();
      }
      setWorkerStatus('offline');
      return null;
    } catch {
      setWorkerStatus('offline');
      return null;
    }
  }, []);

  useEffect(() => {
    checkWorkerHealth();
  }, [checkWorkerHealth]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  };

  const parseCommandLocally = (userMessage: string): { action: string; params: Record<string, string>; message: string } | null => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('health') || lower.includes('status') || lower.includes('worker')) {
      return { action: 'health_check', params: {}, message: 'Checking worker health...' };
    }
    
    if (lower.includes('list') && lower.includes('sprite')) {
      const categoryMatch = lower.match(/list\s+(\w+)\s+sprites?/);
      const category = categoryMatch ? categoryMatch[1] : 'all';
      return { action: 'sprite_list', params: { category }, message: `Listing ${category} sprites...` };
    }
    
    const generateMatch = lower.match(/generate\s+(?:a|an)?\s*(\w+)\s+sprite\s+(?:for\s+)?(.+)/i);
    if (generateMatch) {
      const category = generateMatch[1];
      const name = generateMatch[2].trim();
      const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return { action: 'sprite_generate', params: { category, name, id }, message: `Generating ${name} sprite...` };
    }
    
    if (lower.includes('get') && !lower.includes('sprite')) {
      const keyMatch = lower.match(/get\s+(\w+)/);
      if (keyMatch) {
        return { action: 'kv_get', params: { key: keyMatch[1] }, message: `Getting ${keyMatch[1]}...` };
      }
    }
    
    if (lower.includes('set') && lower.includes(' to ')) {
      const setMatch = lower.match(/set\s+(\w+)\s+to\s+(.+)/);
      if (setMatch) {
        return { action: 'kv_set', params: { key: setMatch[1], value: setMatch[2] }, message: `Setting ${setMatch[1]}...` };
      }
    }
    
    return null;
  };

  const parseCommand = async (userMessage: string): Promise<{ action: string; params: Record<string, string>; message: string }> => {
    const localParse = parseCommandLocally(userMessage);
    if (localParse) {
      return localParse;
    }
    
    if (!isPuterAvailable()) {
      return { action: 'chat', params: {}, message: 'Puter is not available. I can still help with simple commands like "check worker health" or "list sprites".' };
    }

    try {
      const puter = getPuter();
      const response = await puter.ai.chat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ], { model: 'gpt-4o-mini', temperature: 0.3 });

      const content = typeof response === 'object' && 'message' in response 
        ? (response.message as { content: string }).content 
        : String(response);
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.action && typeof parsed.action === 'string') {
            return {
              action: parsed.action,
              params: parsed.params || {},
              message: parsed.message || `Executing ${parsed.action}...`
            };
          }
        }
      } catch (parseError) {
        console.log('JSON parse failed, treating as chat response');
      }
      
      return { action: 'chat', params: {}, message: content };
    } catch (error) {
      console.error('AI parse error:', error);
      return { action: 'chat', params: {}, message: 'I had trouble understanding that. Try simple commands like "check health", "list sprites", or "generate an ore sprite for iron ore".' };
    }
  };

  const executeAction = async (action: string, params: Record<string, string>): Promise<{ success: boolean; result: unknown; message: string }> => {
    switch (action) {
      case 'health_check': {
        const health = await checkWorkerHealth();
        if (health) {
          return { success: true, result: health, message: `Worker is online! Version ${health.version}, capabilities: ${health.capabilities?.join(', ')}` };
        }
        return { success: false, result: null, message: 'Worker is offline or unreachable.' };
      }

      case 'sprite_generate': {
        const { category, name, id } = params;
        if (!category || !name) {
          return { success: false, result: null, message: 'Missing category or name for sprite generation.' };
        }
        
        const spriteId = id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        try {
          const res = await fetch(`${WORKER_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: spriteId, name, category })
          });
          const result = await res.json();
          if (result.success) {
            return { success: true, result, message: `Generated "${name}" sprite in ${category} category! Saved to: ${result.path}` };
          }
          return { success: false, result, message: result.error || 'Failed to generate sprite.' };
        } catch (error) {
          return { success: false, result: error, message: 'Network error connecting to sprite worker.' };
        }
      }

      case 'sprite_list': {
        const { category } = params;
        try {
          if (category && category !== 'all') {
            const res = await fetch(`${WORKER_URL}/api/sprites/${category}`);
            const result = await res.json();
            return { success: true, result, message: `${category}: ${result.count} sprites found` };
          }
          
          const res = await fetch(`${WORKER_URL}/api/manifest`);
          const result = await res.json();
          const summary = Object.entries(result.manifest || {})
            .map(([cat, sprites]) => `${cat}: ${(sprites as string[]).length}`)
            .join(', ');
          return { success: true, result, message: `Total: ${result.totalSprites} sprites across ${result.categories} categories. ${summary}` };
        } catch (error) {
          return { success: false, result: error, message: 'Failed to list sprites from worker.' };
        }
      }

      case 'kv_get': {
        if (!isPuterAvailable()) {
          return { success: false, result: null, message: 'Puter not available for KV operations.' };
        }
        const { key } = params;
        if (!key) {
          return { success: false, result: null, message: 'Missing key for KV get operation.' };
        }
        try {
          const puter = getPuter();
          const value = await puter.kv.get(key);
          return { success: true, result: value, message: value !== null ? `${key} = ${JSON.stringify(value)}` : `Key "${key}" not found.` };
        } catch (error) {
          return { success: false, result: error, message: `Failed to get key: ${key}` };
        }
      }

      case 'kv_set': {
        if (!isPuterAvailable()) {
          return { success: false, result: null, message: 'Puter not available for KV operations.' };
        }
        const { key, value } = params;
        if (!key) {
          return { success: false, result: null, message: 'Missing key for KV set operation.' };
        }
        try {
          const puter = getPuter();
          await puter.kv.set(key, value);
          return { success: true, result: { key, value }, message: `Set ${key} = ${value}` };
        } catch (error) {
          return { success: false, result: error, message: `Failed to set key: ${key}` };
        }
      }

      default:
        return { success: true, result: null, message: '' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    addMessage({ role: 'user', content: userMessage });

    try {
      const parsed = await parseCommand(userMessage);
      
      if (parsed.action === 'chat') {
        addMessage({ role: 'assistant', content: parsed.message });
      } else {
        const actionMsg = addMessage({
          role: 'assistant',
          content: `Executing ${parsed.action}...`,
          action: { type: parsed.action as CommandAction['type'], params: parsed.params, status: 'running' }
        });

        const result = await executeAction(parsed.action, parsed.params);
        
        setMessages(prev => prev.map(m => 
          m.id === actionMsg.id 
            ? { 
                ...m, 
                content: result.message || parsed.message,
                action: { ...m.action!, result: result.result, status: result.success ? 'success' : 'error' }
              }
            : m
        ));
      }
    } catch (error) {
      addMessage({ role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}` });
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const quickCommands = [
    { label: 'Worker Health', command: 'check worker health', icon: Zap },
    { label: 'List Sprites', command: 'list all sprites', icon: Image },
    { label: 'List Keys', command: 'list kv keys', icon: Database },
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl" data-testid="command-center-page">
      <Card className="h-[calc(100vh-120px)] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              GRUDGE Command Center
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={workerStatus === 'online' ? 'default' : workerStatus === 'offline' ? 'destructive' : 'secondary'}
                className="flex items-center gap-1"
                data-testid="worker-status"
              >
                <div className={`w-2 h-2 rounded-full ${workerStatus === 'online' ? 'bg-green-500' : workerStatus === 'offline' ? 'bg-red-500' : 'bg-gray-500'}`} />
                Worker: {workerStatus}
              </Badge>
              <Button variant="ghost" size="icon" onClick={checkWorkerHealth} data-testid="refresh-worker-btn">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {quickCommands.map(({ label, command, icon: Icon }) => (
              <Button
                key={command}
                variant="outline"
                size="sm"
                onClick={() => { setInput(command); inputRef.current?.focus(); }}
                className="text-xs"
                data-testid={`quick-cmd-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden pb-4">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${msg.id}`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-amber-500" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-black'
                        : msg.role === 'system'
                        ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                        : 'bg-zinc-800 text-zinc-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.action && (
                      <div className="mt-2 pt-2 border-t border-white/10 text-xs">
                        <Badge variant={msg.action.status === 'success' ? 'default' : msg.action.status === 'error' ? 'destructive' : 'secondary'}>
                          {msg.action.type}: {msg.action.status}
                        </Badge>
                      </div>
                    )}
                    <span className="text-[10px] opacity-50 block mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-zinc-300" />
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                  </div>
                  <div className="bg-zinc-800 rounded-lg px-4 py-2">
                    <p className="text-sm text-zinc-400">Processing...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command or ask a question..."
              disabled={isProcessing}
              className="flex-1"
              data-testid="command-input"
            />
            <Button type="submit" disabled={isProcessing || !input.trim()} data-testid="send-command-btn">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
