import React from 'react';
import clsx from 'clsx';

export interface CategoryPillProps {
  categories: { id: string; name: string; count?: number }[];
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  categories,
  activeId,
  onSelect,
  className,
}) => {
  return (
    <div className={clsx('flex overflow-x-auto space-x-2', className)}
    >
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={clsx(
            'px-3 py-1 rounded-full text-sm border',
            cat.id === activeId
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-text-main border-border-light hover:bg-gray-100'
          )}
        >
          {cat.name}
          {cat.count != null && (
            <span className="ml-1 text-xs opacity-75">({cat.count})</span>
          )}
        </button>
      ))}
    </div>
  );
};
