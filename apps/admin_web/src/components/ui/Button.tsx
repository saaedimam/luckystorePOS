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
  primary: 'bg-primary text-primary-on hover:bg-primary-hover active:bg-primary-pressed border border-transparent',
  secondary: 'bg-secondary text-secondary-on hover:bg-secondary-hover border border-transparent',
  tertiary: 'bg-surface-raised text-text-primary border border-border-default hover:bg-background-subtle',
  danger: 'bg-danger text-danger-on hover:bg-danger-dark border border-transparent',
  outline: 'bg-transparent text-primary border border-primary hover:bg-primary-subtle',
  ghost: 'bg-transparent text-text-primary hover:bg-background-subtle border border-transparent',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs h-8',
  md: 'px-4 py-2 text-sm h-10',
  lg: 'px-6 py-2.5 text-base h-12',
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
            'inline-flex items-center justify-center font-semibold transition-all rounded-md active:scale-[0.98]',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
            variantClasses[variant],
            sizeClasses[size],
            {
              'opacity-50 cursor-not-allowed grayscale-[0.5]': disabled || loading,
              'pointer-events-none': loading,
            },
            className
          )}
          disabled={disabled || loading}
          {...props}
        >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          <>
            {icon && <span className={clsx(children ? 'mr-2' : '')}>{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
