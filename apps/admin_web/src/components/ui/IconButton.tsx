import React from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  title?: string;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  badge,
  title,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'relative w-10 h-10 rounded-md border-none bg-transparent text-muted',
        'flex items-center justify-center transition-all duration-200',
        'hover:bg-bg hover:text-fg',
        className
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-accent text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

export default IconButton;
