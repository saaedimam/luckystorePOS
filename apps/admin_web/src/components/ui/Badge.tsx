import React from 'react';
import clsx from 'clsx';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  const variantStyles = {
    success: 'bg-success-subtle text-success-dark border-success-dark/10',
    warning: 'bg-warning-subtle text-warning-dark border-warning-dark/10',
    danger: 'bg-danger-subtle text-danger-dark border-danger-dark/10',
    info: 'bg-info-subtle text-info-on border-info-on/10',
    neutral: 'bg-background-subtle text-text-secondary border-border-default',
  }[variant];

  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border', 
      variantStyles, 
      className
    )}>
      {children}
    </span>
  );
};
