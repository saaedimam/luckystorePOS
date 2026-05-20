import React from 'react';
import clsx from 'clsx';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ label, value, onChange, options, className, ...props }) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={clsx(
            'block w-full appearance-none rounded-md border border-border-default bg-surface px-4 py-2.5 text-sm text-text-primary',
            'transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm',
            'pr-10' // Space for custom arrow
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
