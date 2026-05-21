import React from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx("flex flex-col items-center justify-center p-8 text-center min-h-[300px]", className)}>
      {icon && <div className="mb-4 text-text-muted flex items-center justify-center bg-background-default dark:bg-background-subtle border border-border-subtle p-4 rounded-full">{icon}</div>}
      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}