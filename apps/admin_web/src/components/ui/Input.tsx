import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className={clsx('flex flex-col gap-1.5', className)}>
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'rounded-md border border-border-default bg-surface px-4 py-2.5 text-sm text-text-primary',
            'transition-all duration-200 placeholder:text-text-muted',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm',
            { 'border-danger focus:ring-danger/20 focus:border-danger': error }
          )}
          {...props}
        />
        {error && <p className="text-xs font-medium text-danger animate-fade-in">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
