import React from 'react';
import clsx from 'clsx';

export interface TableFiltersProps {
  /** Array of filter definitions */
  filters: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
  }[];
  className?: string;
}

export const TableFilters: React.FC<TableFiltersProps> = ({ filters, className }) => {
  return (
    <div className={clsx('flex flex-wrap gap-4 items-center', className)}>
      {filters.map((filter, idx) => (
        <div key={idx} className="flex items-center space-x-2">
          <label className="text-sm font-medium text-text-main">{filter.label}</label>
          <select
            value={filter.value}
            onChange={e => filter.onChange(e.target.value)}
            className="rounded-md border border-border-light bg-input px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {filter.options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};
