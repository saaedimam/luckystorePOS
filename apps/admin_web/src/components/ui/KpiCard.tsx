import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-xl p-6 transition-all duration-200 hover:shadow-[0_0_0_1px_var(--warm-ring)]',
        className
      )}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {change && (
        <div
          className={cn(
            'kpi-change',
            trend === 'up' && 'kpi-change--up',
            trend === 'down' && 'kpi-change--down'
          )}
        >
          {trend === 'up' && <TrendingUp size={14} />}
          {trend === 'down' && <TrendingDown size={14} />}
          {change}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
