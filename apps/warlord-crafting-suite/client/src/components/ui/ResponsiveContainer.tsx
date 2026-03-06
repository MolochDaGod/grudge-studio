import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  centered?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md", 
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "p-0",
  sm: "p-2 sm:p-3 md:p-4",
  md: "p-3 sm:p-4 md:p-6",
  lg: "p-4 sm:p-6 md:p-8",
};

export function ResponsiveContainer({
  children,
  className,
  maxWidth = "xl",
  padding = "md",
  centered = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "w-full",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        centered && "mx-auto",
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "sm" | "md" | "lg";
}

const gapClasses = {
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4 md:gap-6",
  lg: "gap-4 sm:gap-6 md:gap-8",
};

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = "md",
}: ResponsiveGridProps) {
  const gridCols = cn(
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  );

  return (
    <div
      className={cn(
        "grid",
        gridCols,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "solid";
}

export function ResponsiveCard({
  children,
  className,
  variant = "default",
}: ResponsiveCardProps) {
  const variantClasses = {
    default: "border-2 border-[hsl(43_40%_25%)] bg-[hsl(225_30%_8%)]",
    glass: "border border-white/10 bg-white/5 backdrop-blur-sm",
    solid: "border-2 border-[hsl(43_40%_25%)] bg-[hsl(225_28%_12%)]",
  };

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "transition-all duration-200",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ScalableContainerProps {
  children: ReactNode;
  className?: string;
  minScale?: number;
  aspectRatio?: string;
}

export function ScalableContainer({
  children,
  className,
  minScale = 0.8,
  aspectRatio,
}: ScalableContainerProps) {
  return (
    <div
      className={cn(
        "w-full h-full overflow-hidden",
        className
      )}
      style={{
        aspectRatio: aspectRatio,
      }}
    >
      <div 
        className="w-full h-full origin-top-left"
        style={{
          transform: `scale(clamp(${minScale}, 1, 1))`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
