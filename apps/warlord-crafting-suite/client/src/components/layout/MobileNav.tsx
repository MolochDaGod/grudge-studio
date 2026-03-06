import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Hammer, TreePine, Sparkles, ChefHat, Wrench, LayoutDashboard, Sword, Shield, Store, MessageSquare, Users, Settings, LogIn, LogOut, Crown, Zap, User as UserIcon } from "lucide-react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  requiredRoles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/miner", label: "Miner", icon: Hammer, color: "text-amber-500" },
  { href: "/forester", label: "Forest", icon: TreePine, color: "text-green-500" },
  { href: "/mystic", label: "Mystic", icon: Sparkles, color: "text-purple-400" },
  { href: "/chef", label: "Chef", icon: ChefHat, color: "text-orange-400" },
];

const MORE_ITEMS: NavItem[] = [
  { href: "/engineer", label: "Engineer", icon: Wrench, color: "text-orange-500" },
  { href: "/recipes", label: "Recipes", icon: Sword, color: "text-slate-400" },
  { href: "/shop", label: "Shop", icon: Store, color: "text-[hsl(43_85%_55%)]" },
  { href: "/arsenal", label: "Arsenal", icon: Shield, color: "text-cyan-400" },
  { href: "/command", label: "Command", icon: MessageSquare, color: "text-amber-500", requiredRoles: ['admin', 'developer', 'premium'] },
  { href: "/npcs", label: "NPCs", icon: Users, color: "text-purple-400" },
  { href: "/admin", label: "Admin", icon: Settings, color: "text-red-400", requiredRoles: ['admin', 'developer'] },
];

const ROLE_BADGES: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: 'Admin', icon: <Crown className="w-3 h-3" />, color: 'text-red-400' },
  developer: { label: 'Dev', icon: <Zap className="w-3 h-3" />, color: 'text-purple-400' },
  ai_agent: { label: 'AI', icon: <MessageSquare className="w-3 h-3" />, color: 'text-cyan-400' },
  premium: { label: 'Premium', icon: <Shield className="w-3 h-3" />, color: 'text-amber-400' },
  user: { label: 'User', icon: <UserIcon className="w-3 h-3" />, color: 'text-green-400' },
  guest: { label: 'Guest', icon: <UserIcon className="w-3 h-3" />, color: 'text-slate-400' },
};

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="mobile-bottom-nav safe-area-bottom" data-testid="mobile-nav">
      <div className="flex justify-around items-center">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "mobile-bottom-nav-item",
                  isActive && "active"
                )}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 mb-0.5",
                    isActive ? (item.color || "text-[hsl(43_85%_65%)]") : "text-[hsl(45_15%_45%)]"
                  )}
                />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileNavExpanded({ onClose }: { onClose: () => void }) {
  const [location] = useLocation();
  const { user, isAuthenticated, signOut, hasRole } = useAuth();
  
  const filteredMoreItems = MORE_ITEMS.filter(item => {
    if (!item.requiredRoles) return true;
    if (!isAuthenticated) return false;
    return hasRole(item.requiredRoles);
  });
  
  const allItems = [...NAV_ITEMS, ...filteredMoreItems];
  const userBadge = user ? ROLE_BADGES[user.role] : null;

  return (
    <>
      <div 
        className="mobile-sidebar-overlay" 
        onClick={onClose}
        data-testid="mobile-sidebar-overlay"
      />
      <div className="mobile-sidebar open safe-area-top">
        <div className="p-6 border-b-2 border-[hsl(43_50%_30%)]">
          <h1 className="text-xl font-bold font-uncial gold-text tracking-wider">
            GRUDGE
            <span className="block text-xs font-heading text-[hsl(43_60%_50%)] tracking-[0.3em] mt-1">WARLORDS</span>
          </h1>
        </div>
        
        {isAuthenticated && user && (
          <div className="px-4 py-3 border-b border-[hsl(43_30%_25%)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <span className={userBadge?.color}>{userBadge?.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className={cn("text-xs", userBadge?.color)}>{userBadge?.label}</p>
            </div>
          </div>
        )}
        
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {allItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 border-2",
                    isActive
                      ? "bg-[hsl(225_25%_18%)] border-[hsl(43_60%_40%)] text-[hsl(43_85%_70%)]"
                      : "border-transparent text-[hsl(45_20%_60%)] active:bg-[hsl(225_25%_15%)]"
                  )}
                  data-testid={`mobile-menu-${item.label.toLowerCase()}`}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? item.color : "text-[hsl(45_15%_45%)]"
                    )}
                  />
                  <span className="font-heading font-medium tracking-wide">{item.label}</span>
                  {item.requiredRoles?.includes('admin') && (
                    <Crown className="w-3 h-3 text-red-400 ml-auto opacity-50" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t-2 border-[hsl(43_40%_25%)] space-y-2">
          {isAuthenticated ? (
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded text-red-400 hover:bg-red-500/10 transition-colors"
              data-testid="mobile-logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-heading">Sign Out</span>
            </button>
          ) : (
            <Link href="/login">
              <div
                onClick={onClose}
                className="w-full flex items-center gap-3 px-4 py-3 rounded text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                <span className="font-heading">Sign In</span>
              </div>
            </Link>
          )}
          
          <div className="platform-badge w-full justify-center">
            GRUDACHAIN v2.1.0
          </div>
        </div>
      </div>
    </>
  );
}
