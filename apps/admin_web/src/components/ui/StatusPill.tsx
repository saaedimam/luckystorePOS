import React from 'react';
import { cn } from '../../lib/utils';

export type StatusVariant = 'paid' | 'pending' | 'cancelled' | 'draft' | 'received' | 'adjustment';

export interface StatusPillProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  paid: 'bg-[rgba(74,124,89,0.08)] text-[#4a7c59]',
  pending: 'bg-[rgba(201,162,39,0.08)] text-[#c9a227]',
  cancelled: 'bg-[rgba(181,51,51,0.08)] text-[#b53333]',
  draft: 'bg-bg shadow-[inset_0_0_0_1px_var(--border-color)] text-dim',
  received: 'bg-[rgba(74,124,89,0.08)] text-[#4a7c59]',
  adjustment: 'bg-[rgba(201,162,39,0.08)] text-[#c9a227]',
};

export const StatusPill: React.FC<StatusPillProps> = ({
  variant,
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium leading-none',
        VARIANT_STYLES[variant],
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor:
            variant === 'paid' || variant === 'received'
              ? '#4a7c59'
              : variant === 'pending' || variant === 'adjustment'
              ? '#c9a227'
              : variant === 'cancelled'
              ? '#b53333'
              : '#87867f',
        }}
      />
      {children}
    </span>
  );
};

export default StatusPill;
