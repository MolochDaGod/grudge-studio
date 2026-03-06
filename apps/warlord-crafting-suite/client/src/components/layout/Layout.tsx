import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { PuterAIAgent } from "../PuterAIAgent";
import { useCharacter } from "@/contexts/CharacterContext";
import { Bot, X, WifiOff, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [showAI, setShowAI] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { character } = useCharacter();
  const [location] = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    checkMobile();
    setIsOnline(navigator.onLine);
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isMobile && location !== '/') {
      setSidebarCollapsed(true);
    }
  }, [location, isMobile]);

  return (
    <div className="h-screen overflow-hidden text-foreground font-sans selection:bg-[hsl(43_85%_55%)]/30">
      {!isOnline && (
        <div className="offline-banner flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>You are offline - some features may be unavailable</span>
        </div>
      )}
      <div className="fixed inset-0 bg-[url('/grudge-bg.svg')] opacity-5 pointer-events-none"></div>
      <div className="fixed inset-0 grudge-bg-pattern pointer-events-none"></div>
      <div className="fixed inset-0 vignette pointer-events-none"></div>
      {!isMobile && <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />}
      <main className={cn(
        "h-screen flex flex-col transition-all duration-300 ease-in-out relative z-10",
        isMobile ? "pb-14" : (sidebarCollapsed ? "pl-16" : "pl-64"),
        showAI && !isMobile && "pr-80"
      )}>
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        
        <footer className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-t-2 border-[hsl(43_40%_25%)] bg-[hsl(225_30%_8%)]">
          <a 
            href="https://puter.com/?r=T3SIA5X4" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(45_15%_50%)] hover:text-[hsl(43_85%_65%)] transition-colors font-heading tracking-wider flex-1"
          >
            Powered By Grudge Studio
          </a>
          <span className="text-[10px] text-[hsl(43_60%_50%)] font-heading tracking-wide text-center">GRUDGE Warlords</span>
          <div className="flex-1" />
        </footer>
      </main>
      {isMobile && <MobileNav />}
      {!isMobile && (
        <div className={cn(
          "fixed top-0 right-0 h-screen w-80 z-40 transition-transform duration-300 ease-in-out",
          "bg-gradient-to-b from-[hsl(225_28%_12%)] via-[hsl(225_30%_10%)] to-[hsl(225_32%_8%)]",
          "border-l-2 border-[hsl(43_50%_30%)]",
          showAI ? "translate-x-0" : "translate-x-full"
        )} style={{boxShadow: showAI ? '-4px 0 12px rgba(0,0,0,0.4)' : 'none'}}>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-[hsl(43_40%_25%)] flex items-center justify-between bg-[hsl(225_25%_14%)]">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[hsl(43_85%_65%)]" />
                <span className="font-heading text-sm text-[hsl(43_85%_65%)] tracking-wide">AI Assistant</span>
              </div>
              <button
                onClick={() => setShowAI(false)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                data-testid="button-close-ai"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PuterAIAgent 
                characterName={character?.name} 
                profession={character?.profession ?? undefined}
                onClose={() => setShowAI(false)}
                embedded
              />
            </div>
          </div>
        </div>
      )}
      {!isMobile && (
        <button
          onClick={() => setShowAI(!showAI)}
          className="fixed bottom-12 z-50 transition-all duration-300 flex items-center gap-2 px-3 py-2 rounded-l-lg bg-[hsl(225_28%_14%)] border-2 border-r-0 border-[hsl(43_50%_35%)] hover:bg-[hsl(225_28%_18%)] hover:border-[hsl(43_60%_45%)] right-0 mt-[-40px] mb-[-40px]"
          style={{boxShadow: '-2px 0 8px rgba(0,0,0,0.3)'}}
          data-testid="button-toggle-ai"
        >
          {showAI ? (
            <ChevronRight className="w-4 h-4 text-[hsl(43_85%_65%)]" />
          ) : (
            <>
              <Bot className="w-4 h-4 text-[hsl(43_85%_65%)]" />
              <ChevronLeft className="w-4 h-4 text-[hsl(43_85%_65%)]" />
            </>
          )}
        </button>
      )}
      {isMobile && (
        <>
          <button
            onClick={() => setShowAI(!showAI)}
            className="fixed bottom-16 right-2 w-12 h-12 gilded-button rounded-full flex items-center justify-center z-50"
            data-testid="button-toggle-ai-mobile"
          >
            {showAI ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          </button>
          
          {showAI && (
            <div className="fixed inset-2 bottom-16 z-50 animate-in slide-in-from-bottom-4 duration-300">
              <PuterAIAgent 
                characterName={character?.name ?? undefined} 
                profession={character?.profession ?? undefined}
                onClose={() => setShowAI(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
