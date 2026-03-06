import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Shield, Sword, LayoutDashboard, PanelLeftClose, PanelLeft, Settings, Store, MessageSquare, Users, LogIn, LogOut, Crown, Zap, User, Hammer, Grid3x3 } from "lucide-react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

import minerIcon from '@assets/generated_images/miner_profession_game_icon.png';
import foresterIcon from '@assets/generated_images/forester_profession_game_icon.png';
import mysticIcon from '@assets/generated_images/mystic_profession_game_icon.png';
import chefIcon from '@assets/generated_images/chef_profession_game_icon.png';
import engineerIcon from '@assets/generated_images/engineer_profession_game_icon.png';
import premiumAvatar from '@assets/premium-avatar.png';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconImage?: string;
  color?: string;
  requiredRoles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/miner", label: "Miner", iconImage: minerIcon, color: "text-amber-500" },
  { href: "/forester", label: "Forester", iconImage: foresterIcon, color: "text-green-500" },
  { href: "/mystic", label: "Mystic", iconImage: mysticIcon, color: "text-purple-400" },
  { href: "/chef", label: "Chef", iconImage: chefIcon, color: "text-amber-600" },
  { href: "/engineer", label: "Engineer", iconImage: engineerIcon, color: "text-orange-500" },
  { href: "/recipes", label: "Recipes", icon: Sword, color: "text-slate-400" },
  { href: "/crafting", label: "Crafting", icon: Hammer, color: "text-orange-400" },
  { href: "/shop", label: "Shop", icon: Store, color: "text-[hsl(43_85%_55%)]" },
  { href: "/arsenal", label: "Arsenal", icon: Shield, color: "text-cyan-400" },
  { href: "/command", label: "Command", icon: MessageSquare, color: "text-amber-500", requiredRoles: ['admin', 'developer', 'premium'] },
  { href: "/npcs", label: "NPCs", icon: Users, color: "text-purple-400" },
  { href: "/admin", label: "Admin", icon: Settings, color: "text-red-400", requiredRoles: ['admin', 'developer'] },
  { href: "/adminmap", label: "Map Editor", icon: Grid3x3, color: "text-emerald-400", requiredRoles: ['admin', 'developer'] },
];

const ROLE_BADGES: Record<UserRole, { label: string; icon: React.ReactNode; color: string; bgColor: string; avatarImage?: string }> = {
  admin: { label: 'Admin', icon: <Crown className="w-3 h-3" />, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  developer: { label: 'Dev', icon: <Zap className="w-3 h-3" />, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  ai_agent: { label: 'AI', icon: <MessageSquare className="w-3 h-3" />, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  premium: { label: 'Premium', icon: <Shield className="w-3 h-3" />, color: 'text-amber-400', bgColor: 'bg-amber-500/20', avatarImage: premiumAvatar },
  user: { label: 'User', icon: <User className="w-3 h-3" />, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  guest: { label: 'Guest', icon: <User className="w-3 h-3" />, color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, signOut, hasRole } = useAuth();

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (!item.requiredRoles) return true;
    if (!isAuthenticated) return false;
    return hasRole(item.requiredRoles);
  });

  const userBadge = user ? ROLE_BADGES[user.role] : null;

  return (
    <aside className={cn(
      "h-screen flex flex-col fixed left-0 top-0 z-50 bg-gradient-to-b from-[hsl(225_28%_12%)] via-[hsl(225_30%_10%)] to-[hsl(225_32%_8%)] border-r-2 border-[hsl(43_50%_30%)] transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )} style={{boxShadow: 'inset -1px 0 0 rgba(212,175,55,0.2), 4px 0 12px rgba(0,0,0,0.4)'}}>
      <div className={cn(
        "border-b-2 border-[hsl(43_50%_30%)] transition-all duration-300",
        collapsed ? "p-3" : "p-6"
      )} style={{background: 'linear-gradient(180deg, hsl(225 25% 14%) 0%, hsl(225 28% 10%) 100%)'}}>
        {collapsed ? (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(43_85%_55%)] to-[hsl(35_90%_45%)] flex items-center justify-center">
            <span className="text-lg font-uncial font-bold text-[hsl(225_30%_10%)]">G</span>
          </div>
        ) : (
          <h1 className="text-2xl font-bold font-uncial gold-text tracking-wider">
            GRUDGE
            <span className="block text-xs font-heading text-[hsl(43_60%_50%)] tracking-[0.3em] mt-1 font-semibold">WARLORDS</span>
          </h1>
        )}
      </div>

      {isAuthenticated && user && (
        <div className={cn(
          "border-b border-[hsl(43_30%_25%)] transition-all duration-300",
          collapsed ? "p-2" : "p-3"
        )}>
          {collapsed ? (
            <div 
              className={cn("w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden", userBadge?.bgColor)}
              title={`${user.username} (${userBadge?.label})`}
            >
              {userBadge?.avatarImage ? (
                <img src={userBadge.avatarImage} alt={userBadge.label} className="w-full h-full object-cover" />
              ) : (
                <span className={cn("text-sm", userBadge?.color)}>{userBadge?.icon}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden", userBadge?.bgColor)}>
                {userBadge?.avatarImage ? (
                  <img src={userBadge.avatarImage} alt={userBadge.label} className="w-full h-full object-cover" />
                ) : (
                  <span className={userBadge?.color}>{userBadge?.icon}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.username}</p>
                <p className={cn("text-xs", userBadge?.color)}>{userBadge?.label}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto transition-all duration-300",
        collapsed ? "p-2" : "p-3"
      )}>
        {filteredNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 rounded transition-all duration-200 group cursor-pointer border-2",
                collapsed ? "px-2 py-3 justify-center" : "px-4 py-3",
                location === item.href
                  ? "bg-[hsl(225_25%_18%)] border-[hsl(43_60%_40%)] text-[hsl(43_85%_70%)] font-medium"
                  : "border-transparent text-[hsl(45_20%_60%)] hover:text-[hsl(43_80%_70%)] hover:bg-[hsl(225_25%_15%)] hover:border-[hsl(43_40%_30%)]"
              )}
              style={location === item.href ? {boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.3)'} : {}}
              title={collapsed ? item.label : undefined}
            >
              {item.iconImage ? (
                <img 
                  src={item.iconImage} 
                  alt={item.label}
                  className={cn(
                    "w-6 h-6 transition-transform group-hover:scale-110 duration-200 object-contain",
                    location === item.href ? "brightness-110" : "brightness-75 group-hover:brightness-100"
                  )}
                />
              ) : item.icon ? (
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110 duration-200",
                    location === item.href ? item.color : "text-[hsl(45_15%_45%)] group-hover:text-[hsl(43_70%_60%)]"
                  )}
                />
              ) : null}
              {!collapsed && (
                <>
                  <span className="font-heading font-medium tracking-wide text-sm">{item.label}</span>
                  {location === item.href && (
                    <div className={cn("ml-auto w-2 h-2 rounded-full", item.color?.replace('text-', 'bg-') || 'bg-[hsl(43_85%_55%)]')} style={{boxShadow: '0 0 6px currentColor'}} />
                  )}
                  {item.requiredRoles?.includes('admin') && (
                    <Crown className="w-3 h-3 text-red-400 ml-auto opacity-50" />
                  )}
                </>
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t-2 border-[hsl(43_40%_25%)] space-y-1">
        {isAuthenticated ? (
          <button
            onClick={() => signOut()}
            className={cn(
              "w-full flex items-center gap-2 rounded transition-all duration-200 hover:bg-red-500/10 border-2 border-transparent hover:border-red-500/30 text-red-400",
              collapsed ? "p-3 justify-center" : "p-3"
            )}
            data-testid="button-logout"
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-xs font-heading tracking-wider">Sign Out</span>}
          </button>
        ) : (
          <Link href="/login">
            <div
              className={cn(
                "w-full flex items-center gap-2 rounded transition-all duration-200 hover:bg-amber-500/10 border-2 border-transparent hover:border-amber-500/30 text-amber-400 cursor-pointer",
                collapsed ? "p-3 justify-center" : "p-3"
              )}
              title={collapsed ? "Sign In" : undefined}
            >
              <LogIn className="w-5 h-5" />
              {!collapsed && <span className="text-xs font-heading tracking-wider">Sign In</span>}
            </div>
          </Link>
        )}
        
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 rounded transition-all duration-200 hover:bg-[hsl(225_25%_18%)] border-2 border-transparent hover:border-[hsl(43_40%_30%)]",
            collapsed ? "p-3 justify-center" : "p-3"
          )}
          data-testid="button-toggle-sidebar"
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5 text-[hsl(43_60%_50%)]" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5 text-[hsl(43_60%_50%)]" />
              <span className="text-xs text-[hsl(43_40%_50%)] font-heading tracking-wider">Collapse</span>
            </>
          )}
        </button>
        <div className={cn(
          "inset-panel text-xs text-[hsl(43_40%_50%)] text-center font-heading tracking-wider",
          collapsed ? "p-2" : "p-3"
        )}>
          {collapsed ? "v2" : "v2.0.5 ALPHA"}
        </div>
      </div>
    </aside>
  );
}
