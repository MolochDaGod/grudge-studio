import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isPuterAvailable, getPuter } from '@/lib/puter';
import { Bot, Send, Loader2, Sparkles, Volume2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface PuterAIAgentProps {
  characterName?: string;
  profession?: string;
  onClose?: () => void;
  embedded?: boolean;
}

const SYSTEM_PROMPT = `You are the GRUDGE Warlords AI Assistant, an expert guide for the crafting and progression system. You help players with:

- **Professions**: Miner, Forester, Mystic, Chef, Engineer - each with unique crafting specializations
- **Crafting**: Materials from T1 (Copper, Pine) to T8 (Divine), recipes, and progression
- **Equipment**: 6 armor sets (Bloodfeud, Wraithfang, Oathbreaker, Kinrend, Dusksinger, Emberclad) across Cloth, Leather, Metal, and Gem materials
- **Weapons**: Swords, Axes, Daggers, Hammers, Greatswords, Greataxes (Miner), Bows (Forester), Crossbows/Guns (Engineer), Staves (Mystic)
- **Skill Trees**: Profession-specific abilities and specializations

Be helpful, concise, and stay in character as a knowledgeable guild advisor. Use game terminology and be encouraging to new players.`;

export function PuterAIAgent({ characterName, profession, onClose, embedded }: PuterAIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: characterName 
        ? `Greetings, ${characterName} the ${profession}! I am your GRUDGE Warlords advisor. How may I assist you with crafting, skills, or equipment today?`
        : `Welcome to GRUDGE Warlords! I am your AI advisor. Ask me anything about professions, crafting, equipment, or skill trees.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!isPuterAvailable()) {
        const fallbackResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm currently running in demo mode. In the full Puter deployment, I'll have access to advanced AI models like Claude and GPT for comprehensive assistance!",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackResponse]);
        setIsLoading(false);
        return;
      }

      const puter = getPuter();
      const conversationHistory = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content }
      ];

      setIsStreaming(true);
      const streamingMessageId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: streamingMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      const response = await puter.ai.chat(conversationHistory, { 
        model: 'claude-sonnet-4',
        stream: true 
      }) as AsyncIterable<{ text: string }>;

      let fullContent = '';
      for await (const part of response) {
        if (part?.text) {
          fullContent += part.text;
          setMessages(prev => prev.map(m => 
            m.id === streamingMessageId 
              ? { ...m, content: fullContent }
              : m
          ));
        }
      }

      setIsStreaming(false);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again or check your connection to Puter.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const speakMessage = async (text: string) => {
    if (!isPuterAvailable()) return;
    
    try {
      const puter = getPuter();
      const audio = await puter.ai.txt2speech(text.slice(0, 500), {
        voice: 'Matthew',
        engine: 'neural',
        language: 'en-US'
      });
      audio.play();
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  if (embedded) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto p-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded px-3 py-2 ${
                    message.role === 'user'
                      ? 'gilded-button text-[hsl(225_30%_10%)]'
                      : 'stone-panel border border-[hsl(43_40%_30%)] text-[hsl(45_30%_80%)]'
                  }`}
                >
                  <p className="text-xs whitespace-pre-wrap font-body">{message.content}</p>
                  {message.role === 'assistant' && message.content && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-5 px-1.5 text-[10px] text-[hsl(45_20%_50%)] hover:text-[hsl(43_85%_65%)]"
                      onClick={() => speakMessage(message.content)}
                      data-testid={`button-speak-${message.id}`}
                    >
                      <Volume2 className="w-3 h-3 mr-1" />
                      Listen
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex items-center gap-2 text-[hsl(43_60%_55%)] text-xs font-heading">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 p-3 border-t border-[hsl(43_40%_25%)] bg-[hsl(225_30%_10%)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 h-8 text-xs inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)] placeholder:text-[hsl(45_15%_40%)]"
              disabled={isLoading}
              data-testid="input-ai-message"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isLoading || !input.trim()}
              data-testid="button-send-message"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader className="pb-3 border-b-2 border-[hsl(43_50%_30%)]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[hsl(43_85%_55%)]" />
            <span>GRUDGE AI Advisor</span>
            <Sparkles className="w-4 h-4 text-purple-400" style={{filter: 'drop-shadow(0 0 4px hsl(271 91% 65%))'}} />
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-[hsl(45_20%_55%)] hover:text-[hsl(45_30%_80%)]">
              Close
            </Button>
          )}
        </div>
        <p className="text-xs text-[hsl(45_20%_50%)] mt-1 font-body">Powered by Puter AI - Free to use</p>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-80 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded px-4 py-2 ${
                    message.role === 'user'
                      ? 'gilded-button text-[hsl(225_30%_10%)]'
                      : 'stone-panel border-2 border-[hsl(43_40%_30%)] text-[hsl(45_30%_80%)]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap font-body">{message.content}</p>
                  {message.role === 'assistant' && message.content && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 px-2 text-xs text-[hsl(45_20%_50%)] hover:text-[hsl(43_85%_65%)]"
                      onClick={() => speakMessage(message.content)}
                      data-testid={`button-speak-${message.id}`}
                    >
                      <Volume2 className="w-3 h-3 mr-1" />
                      Listen
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex items-center gap-2 text-[hsl(43_60%_55%)] text-sm font-heading">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t-2 border-[hsl(43_40%_25%)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crafting, professions, equipment..."
              className="flex-1 inset-panel border-[hsl(43_40%_30%)] text-[hsl(45_30%_85%)] placeholder:text-[hsl(45_15%_40%)]"
              disabled={isLoading}
              data-testid="input-ai-message"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              data-testid="button-send-message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
