import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "stat-card",
  primary: "stat-card-gradient bg-gradient-to-br from-primary to-info",
  success: "stat-card-gradient bg-gradient-to-br from-success to-emerald-400",
  warning: "stat-card-gradient bg-gradient-to-br from-warning to-orange-400",
  danger: "stat-card-gradient bg-gradient-to-br from-destructive to-rose-400",
};

const iconStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-white/20 text-white",
  success: "bg-white/20 text-white",
  warning: "bg-white/20 text-white",
  danger: "bg-white/20 text-white",
};

export function StatCard({ title, value, subtitle, icon, trend, variant = "default" }: StatCardProps) {
  const isGradient = variant !== "default";

  return (
    <div className={cn(variantStyles[variant], "animate-fade-in")}>
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-lg", iconStyles[variant])}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-sm font-medium px-2 py-1 rounded-full",
            isGradient 
              ? "bg-white/20" 
              : trend.isPositive 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={cn(
          "text-sm font-medium",
          isGradient ? "text-white/80" : "text-muted-foreground"
        )}>
          {title}
        </p>
        <p className={cn(
          "text-3xl font-bold mt-1",
          isGradient ? "text-white" : "text-foreground"
        )}>
          {value}
        </p>
        {subtitle && (
          <p className={cn(
            "text-sm mt-1",
            isGradient ? "text-white/70" : "text-muted-foreground"
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
