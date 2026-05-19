/**
 * POS Design System Tokens (Tailwind-compatible)
 * Focus: High-contrast, premium, touch-friendly UI for retail.
 */

export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#0EA5E9', // Sky 500
      dark: '#0284C7',
      light: '#7DD3FC',
    },
    success: {
      DEFAULT: '#10B981', // Emerald 500
      dark: '#059669',
    },
    danger: {
      DEFAULT: '#EF4444', // Red 500
      dark: '#DC2626',
    },
    warning: {
      DEFAULT: '#F59E0B', // Amber 500
    },
    bg: {
      main: '#0F172A', // Slate 900
      card: '#1E293B', // Slate 800
      accent: '#334155', // Slate 700
    },
    text: {
      main: '#F8FAFC', // Slate 50
      muted: '#94A3B8', // Slate 400
      dim: '#64748B', // Slate 500
    }
  },
  spacing: {
    touch: '48px', // Minimum touch target
    card: '24px',
    list: '12px',
  },
  effects: {
    glass: 'backdrop-blur-md bg-white/10 border border-white/20',
    shadow: 'shadow-xl shadow-black/40',
    glow: 'shadow-[0_0_15px_rgba(14,165,233,0.3)]',
  },
  animation: {
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    fast: { duration: 0.2 },
  }
};

export type Tokens = typeof tokens;
