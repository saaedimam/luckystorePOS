import React from 'react';
import { cn } from '../../lib/utils';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendLabel?: string;
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  badge?: string;
  className?: string;
  chart?: React.ReactNode;
  glass?: boolean;
}

const COLOR_MAP = {
  primary: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  danger: 'text-danger bg-danger/10',
  warning: 'text-warning bg-warning/10',
  info: 'text-info bg-info/10',
  neutral: 'text-text-secondary bg-text-muted/10',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'primary',
  badge,
  className,
  chart,
  glass = true,
}) => {
  return (
    <Card 
      glass={glass} 
      hover 
      padding="none" 
      className={cn("overflow-hidden group", className)}
    >
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "p-2 rounded-md transition-transform group-hover:scale-110 duration-300",
            COLOR_MAP[color]
          )}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
              trend === 'up' 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            )}>
              {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendLabel}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
            {title}
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums tracking-tight text-text-primary">
                {value}
              </span>
              {badge && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                  COLOR_MAP[color]
                )}>
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {chart && (
        <div className="h-16 w-full opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          {chart}
        </div>
      )}
    </Card>
  );
};
