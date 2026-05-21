import React, { useMemo } from 'react';
import clsx from 'clsx';

export interface Category {
  id: string;
  name: string;
  itemCount?: number;
  imageUrl?: string;
  color?: string;
  icon?: string;
}

interface CategoryThumbnailGridProps {
  categories: Category[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}

/** Deterministic icon mapping from category name to a display label */
function getCategoryDisplay(name: string): { icon: string; color: string } {
  const hash = name.toLowerCase().trim();
  const palette = [
    'var(--color-primary-default)',
    'var(--color-secondary-default)',
    'var(--color-info-default)',
    'var(--color-success-default)',
    'var(--color-danger-default)',
    'var(--color-warning-default)',
  ];
  let h = 0;
  for (let i = 0; i < hash.length; i++) h = ((h << 5) - h) + hash.charCodeAt(i);
  const color = palette[Math.abs(h) % palette.length];

  const iconMap: Record<string, string> = {
    fruit: '🍎', apple: '🍎', veg: '🥦', vegetable: '🥦',
    bakery: '🥐', bread: '🥐', cake: '🎂',
    dairy: '🥛', milk: '🥛', cheese: '🧀', egg: '🥚',
    drink: '🥤', beverage: '🥤', juice: '🧃', water: '💧',
    clean: '🧹', cleaning: '🧼', household: '🏠',
    pharma: '💊', medicine: '💊', health: '❤️',
    pet: '🐶', animal: '🐱',
    toy: '🧸', game: '🎮', baby: '👶',
    snack: '🍿', chip: '🍪', biscuit: '🍪',
    rice: '🍚', grain: '🌾', flour: '🌾',
    oil: '🛢️', spice: '🌶️', masala: '🌶️',
    meat: '🍗', chicken: '🐔', fish: '🐟', beef: '🥩',
    frozen: '🧊', ice: '🍦',
    default: '📦',
  };

  let icon = iconMap.default;
  for (const key of Object.keys(iconMap)) {
    if (hash.includes(key)) { icon = iconMap[key]; break; }
  }
  return { icon, color };
}

export const CategoryThumbnailGrid: React.FC<CategoryThumbnailGridProps> = ({
  categories,
  selectedId,
  onSelect,
  className,
}) => {
  const enriched = useMemo(() => {
    return categories.map((c) => {
      const display = getCategoryDisplay(c.name);
      return {
        ...c,
        color: c.color || display.color,
        icon: c.icon || display.icon,
      };
    });
  }, [categories]);

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {/* All button */}
        <button
          onClick={() => onSelect(null)}
          className={clsx(
            'flex-shrink-0 flex flex-col items-center justify-center gap-2',
            'w-24 h-28 rounded-xl border-2 transition-all duration-200',
            selectedId === null || selectedId === undefined
              ? 'border-primary bg-primary-subtle shadow-level-2 scale-105'
              : 'border-border-default bg-surface-default hover:border-primary/40 hover:shadow-level-1'
          )}
        >
          <div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
              selectedId === null || selectedId === undefined
                ? 'bg-primary-default text-primary-on'
                : 'bg-background-subtle text-text-secondary'
            )}
          >
            📦
          </div>
          <span
            className={clsx(
              'text-xs font-semibold text-center leading-tight px-1',
              selectedId === null || selectedId === undefined ? 'text-primary-default' : 'text-text-secondary'
            )}
          >
            All
          </span>
        </button>

        {enriched.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={clsx(
              'flex-shrink-0 flex flex-col items-center justify-center gap-2',
              'w-24 h-28 rounded-xl border-2 transition-all duration-200',
              selectedId === cat.id
                ? 'border-primary bg-primary-subtle shadow-level-2 scale-105'
                : 'border-border-default bg-surface-default hover:border-primary/40 hover:shadow-level-1'
            )}
          >
            {cat.imageUrl ? (
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="w-12 h-12 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 15%, transparent)`, color: cat.color }}
              >
                {cat.icon}
              </div>
            )}
            <span
              className={clsx(
                'text-xs font-semibold text-center leading-tight px-1 truncate w-full',
                selectedId === cat.id ? 'text-primary-default' : 'text-text-secondary'
              )}
            >
              {cat.name}
            </span>
            {typeof cat.itemCount === 'number' && (
              <span className="text-[10px] text-text-muted font-medium">
                {cat.itemCount} items
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
