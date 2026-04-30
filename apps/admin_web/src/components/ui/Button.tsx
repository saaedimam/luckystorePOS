import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  // Secondary uses black background via CSS variable
  secondary: 'text-white',
  // Tertiary uses the CSS variable directly because Tailwind does not have a bg-tertiary class
  tertiary: 'text-white hover:opacity-90',
  danger: 'bg-danger text-white hover:bg-danger-hover',
  outline: 'border border-primary text-primary hover:bg-primary/5',
  ghost: 'hover:bg-gray-100',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-2.5 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    className,
    disabled,
    ...props
  }, ref) => {
    return (
      <button
          ref={ref}
          className={clsx(
            'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
            variantClasses[variant],
            sizeClasses[size],
            {
              'opacity-50 cursor-not-allowed': disabled || loading,
              'pointer-events-none': loading,
            },
            className
          )}
          // Apply custom background for tertiary using CSS variable
          style={
            variant === 'tertiary'
              ? { backgroundColor: 'var(--color-tertiary)' }
              : variant === 'secondary'
              ? { backgroundColor: 'var(--color-secondary)' }
              : undefined
          }
          disabled={disabled || loading}
          {...props}
        >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
