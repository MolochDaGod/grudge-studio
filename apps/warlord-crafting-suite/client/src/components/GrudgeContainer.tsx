import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePlatform } from "@/contexts/PlatformContext";
import { Menu, Maximize2, Minimize2 } from "lucide-react";

interface GrudgeContainerProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "fullscreen";
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  onMenuToggle?: () => void;
}

export function GrudgeContainer({ 
  children, 
  className,
  variant = "default",
  title,
  subtitle,
  showHeader = true,
  onMenuToggle
}: GrudgeContainerProps) {
  const { platform: platformInfo } = usePlatform();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const platformType = platformInfo.platform;
  const isTouchDevice = platformInfo.isTouchDevice;
  const isMobile = platformType === 'mobile';
  const isTablet = platformType === 'tablet';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      className={cn(
        "grudge-container relative flex flex-col",
        variant === "fullscreen" && "min-h-screen h-screen",
        variant === "compact" && "rounded",
        isTouchDevice && "touch-manipulation",
        className
      )}
      data-testid="grudge-container"
      data-platform={platformType}
      data-touch={isTouchDevice}
    >
      {showHeader && title && (
        <header 
          className={cn(
            "grudge-header flex-shrink-0 relative z-20",
            "border-b-2 border-[hsl(43_50%_30%)]",
            "bg-gradient-to-b from-[hsl(225_25%_18%)] to-[hsl(225_28%_12%)]",
            isMobile ? "px-3 py-2" : "px-6 py-3"
          )}
          style={{
            backgroundImage: 'linear-gradient(180deg, hsl(225 25% 18%) 0%, hsl(225 28% 12%) 100%)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {isMobile && onMenuToggle && (
                <button 
                  onClick={onMenuToggle}
                  className="p-2 -ml-2 touch-target rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                  data-testid="button-menu-toggle"
                >
                  <Menu className="w-5 h-5 text-[hsl(43_85%_65%)]" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className={cn(
                  "font-heading font-bold text-[hsl(43_85%_65%)] tracking-wide truncate",
                  "text-shadow-gold",
                  isMobile ? "text-lg" : isTablet ? "text-xl" : "text-2xl"
                )}>
                  {title}
                </h1>
                {subtitle && (
                  <p className={cn(
                    "text-[hsl(45_15%_55%)] truncate",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!isMobile && (
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                  data-testid="button-fullscreen"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-[hsl(45_15%_55%)]" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-[hsl(45_15%_55%)]" />
                  )}
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <div className={cn(
        "grudge-content flex-1 min-h-0 overflow-auto",
        variant === "fullscreen" ? "" : "ornate-frame rounded",
        isTouchDevice && "overscroll-contain"
      )}>
        <div className={cn(
          "h-full",
          variant === "compact" ? "p-3" : isMobile ? "p-3" : isTablet ? "p-4" : "p-6",
          "relative"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function GrudgeSection({ 
  children, 
  className,
  title,
  icon,
  collapsible = false,
  defaultCollapsed = false
}: { 
  children: ReactNode; 
  className?: string;
  title?: string;
  icon?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { platform: platformInfo } = usePlatform();
  const isMobile = platformInfo.platform === 'mobile';

  return (
    <section className={cn(
      "fantasy-panel rounded overflow-hidden",
      className
    )}>
      {title && (
        <button 
          className={cn(
            "w-full px-4 py-3 border-b-2 border-[hsl(43_50%_30%)] text-left",
            "flex items-center justify-between gap-2",
            collapsible && "cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
          )}
          style={{background: 'linear-gradient(180deg, hsl(225 25% 16%) 0%, hsl(225 28% 12%) 100%)'}}
          onClick={() => collapsible && setCollapsed(!collapsed)}
          disabled={!collapsible}
        >
          <h2 className={cn(
            "font-heading font-bold text-[hsl(43_85%_65%)] flex items-center gap-2",
            isMobile ? "text-base" : "text-lg"
          )}>
            {icon && <span>{icon}</span>}
            {title}
          </h2>
          {collapsible && (
            <span className={cn(
              "text-[hsl(45_15%_55%)] transition-transform duration-200",
              collapsed && "-rotate-90"
            )}>
              ▼
            </span>
          )}
        </button>
      )}
      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
      )}>
        <div className={cn(isMobile ? "p-3" : "p-4")}>
          {children}
        </div>
      </div>
    </section>
  );
}

export function GrudgeCard({
  children,
  className,
  glow,
  tier,
  interactive = false,
  onClick
}: {
  children: ReactNode;
  className?: string;
  glow?: "amber" | "green" | "blue" | "purple" | "red" | "orange";
  tier?: number;
  interactive?: boolean;
  onClick?: () => void;
}) {
  const { platform: platformInfo } = usePlatform();
  const isTouchDevice = platformInfo.isTouchDevice;
  const isMobile = platformInfo.platform === 'mobile';

  const glowColors = {
    amber: "border-[hsl(43_70%_45%)] hover:border-[hsl(43_80%_55%)]",
    green: "border-[hsl(120_50%_35%)] hover:border-[hsl(120_60%_45%)]",
    blue: "border-[hsl(220_60%_45%)] hover:border-[hsl(220_70%_55%)]",
    purple: "border-[hsl(280_60%_45%)] hover:border-[hsl(280_70%_55%)]",
    red: "border-[hsl(0_60%_40%)] hover:border-[hsl(0_70%_50%)]",
    orange: "border-[hsl(30_70%_45%)] hover:border-[hsl(30_80%_55%)]",
  };

  const tierColors: Record<number, string> = {
    1: "border-[hsl(0_0%_40%)]",
    2: "border-[hsl(120_60%_40%)]",
    3: "border-[hsl(220_70%_50%)]",
    4: "border-[hsl(280_60%_50%)]",
    5: "border-[hsl(43_85%_55%)]",
    6: "border-[hsl(30_80%_50%)]",
    7: "border-[hsl(0_70%_50%)]",
    8: "border-[hsl(320_70%_55%)]",
  };

  const Component = interactive || onClick ? 'button' : 'div';

  return (
    <Component 
      onClick={onClick}
      className={cn(
        "stone-panel rounded transition-all duration-300 border-2 text-left w-full",
        isMobile ? "p-3" : "p-4",
        "hover:bg-[hsl(225_22%_18%)]",
        interactive && "cursor-pointer",
        interactive && isTouchDevice && "active:scale-[0.98] active:bg-[hsl(225_22%_20%)]",
        glow ? glowColors[glow] : "border-[hsl(43_40%_30%)]",
        tier && tierColors[tier],
        className
      )}
      style={{boxShadow: glow || tier ? `0 0 12px ${glow ? 'currentColor' : 'rgba(212,175,55,0.2)'}` : undefined}}
    >
      {children}
    </Component>
  );
}

export function TierBadge({ tier, size = "default" }: { tier: number; size?: "small" | "default" | "large" }) {
  const tierStyles: Record<number, string> = {
    1: "bg-[hsl(0_0%_35%)] text-[hsl(0_0%_80%)] border-[hsl(0_0%_45%)]",
    2: "bg-[hsl(120_40%_25%)] text-[hsl(120_60%_70%)] border-[hsl(120_50%_40%)]",
    3: "bg-[hsl(220_50%_30%)] text-[hsl(220_70%_75%)] border-[hsl(220_60%_45%)]",
    4: "bg-[hsl(280_45%_30%)] text-[hsl(280_60%_75%)] border-[hsl(280_55%_45%)]",
    5: "bg-[hsl(43_60%_30%)] text-[hsl(43_85%_75%)] border-[hsl(43_70%_45%)]",
    6: "bg-[hsl(30_55%_30%)] text-[hsl(30_80%_75%)] border-[hsl(30_65%_45%)]",
    7: "bg-[hsl(0_50%_30%)] text-[hsl(0_70%_75%)] border-[hsl(0_60%_45%)]",
    8: "bg-gradient-to-r from-[hsl(320_60%_40%)] to-[hsl(280_60%_45%)] text-white border-[hsl(300_60%_55%)] animate-pulse",
  };

  const sizeStyles = {
    small: "px-1.5 py-0.5 text-[10px]",
    default: "px-2.5 py-1 text-xs",
    large: "px-3 py-1.5 text-sm",
  };

  return (
    <span 
      className={cn(
        "rounded font-heading font-bold border-2 inline-flex items-center justify-center",
        tierStyles[tier] || tierStyles[1],
        sizeStyles[size]
      )}
      style={{boxShadow: tier >= 5 ? '0 0 8px currentColor' : undefined}}
    >
      T{tier}
    </span>
  );
}

export function SmartFrame({ 
  children, 
  className,
  aspectRatio = "auto"
}: { 
  children: ReactNode; 
  className?: string;
  aspectRatio?: "auto" | "16:9" | "4:3" | "1:1" | "9:16";
}) {
  const { platform: platformInfo } = usePlatform();
  const platformType = platformInfo.platform;
  const screenWidth = platformInfo.screenWidth;
  const isMobile = platformType === 'mobile';
  const isTablet = platformType === 'tablet';

  const getAspectClass = () => {
    if (aspectRatio === "auto") return "";
    const ratioMap: Record<string, string> = {
      "16:9": "aspect-video",
      "4:3": "aspect-[4/3]",
      "1:1": "aspect-square",
      "9:16": "aspect-[9/16]"
    };
    return ratioMap[aspectRatio] || "";
  };

  const getScaleFactor = () => {
    if (isMobile) return Math.min(1, screenWidth / 375);
    if (isTablet) return Math.min(1, screenWidth / 768);
    return 1;
  };

  return (
    <div 
      className={cn(
        "smart-frame relative w-full h-full",
        getAspectClass(),
        className
      )}
      style={{
        '--scale-factor': getScaleFactor(),
      } as React.CSSProperties}
      data-platform={platformType}
    >
      {children}
    </div>
  );
}

export function TouchTarget({
  children,
  className,
  onClick,
  disabled = false
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { platform: platformInfo } = usePlatform();
  const isTouchDevice = platformInfo.isTouchDevice;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "touch-target relative",
        isTouchDevice && "min-h-[44px] min-w-[44px]",
        "flex items-center justify-center",
        "transition-all duration-150",
        !disabled && "active:scale-95",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
