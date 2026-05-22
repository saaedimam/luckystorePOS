'use client';

import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "h-12 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    // Primary Gold from tokens.ts (#D4A843)
    primary: "bg-primary text-primary-contrast hover:bg-primary-hover focus:ring-primary shadow-md hover:shadow-lg",
    // Secondary Outline
    secondary: "bg-surface-default border border-border-default text-text-secondary hover:border-border-strong focus:ring-border-strong",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary",
    danger: "bg-danger-default text-white hover:bg-danger-dark focus:ring-danger-default",
  };

  const disabledStyles = "disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:active:scale-100";

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        disabledStyles,
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={18} />}
        </>
      )}
    </button>
  );
};
