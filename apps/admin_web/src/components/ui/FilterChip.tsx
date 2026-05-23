import React from 'react';
import { cn } from '../../lib/utils';

export interface FilterChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  children,
  active = false,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 px-3 rounded-md border text-sm font-medium transition-all duration-200',
        active
          ? 'border-accent text-accent bg-[rgba(201,100,66,0.04)]'
          : 'border-border bg-surface text-muted hover:border-warm-border-warm hover:text-fg',
        className
      )}
    >
      {children}
    </button>
  );
};

export default FilterChip;
