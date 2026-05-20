import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeMap: Record<Size, string> = {
  sm: "h-8 px-3 text-[12px] gap-1.5 rounded-md",
  md: "h-10 px-4 text-[14px] gap-2 rounded-md",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-lg",
};

const variantClass: Record<Variant, string> = {
  primary:
    "text-[#0B0D12] shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_0_0_1px_rgba(212,168,67,0.4),0_8px_24px_-12px_rgba(212,168,67,0.55)] hover:brightness-110 active:brightness-95",
  secondary:
    "border bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] hover:border-[var(--border-hover)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
  destructive:
    "bg-[var(--accent-rose)] text-white hover:brightness-110 active:brightness-95",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    children,
    className = "",
    disabled,
    style,
    ...rest
  },
  ref,
) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "relative inline-flex items-center justify-center font-semibold select-none",
        "transition-[transform,background-color,box-shadow,filter,border-color] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        sizeMap[size],
        variantClass[variant],
        className,
      ].join(" ")}
      style={{
        backgroundColor: isPrimary ? "var(--accent-gold)" : undefined,
        borderColor: isSecondary ? "var(--border)" : undefined,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="animate-spin-slow inline-block rounded-full border-2 border-current border-r-transparent"
          style={{ width: size === "sm" ? 12 : 14, height: size === "sm" ? 12 : 14 }}
        />
      )}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});
