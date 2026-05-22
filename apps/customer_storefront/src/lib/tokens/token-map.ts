/**
 * Token Map - Fallback Values
 *
 * This file maps between Stitch token names and CSS custom properties.
 * When Stitch MCP is not available, these fallback values are used.
 * They match the current Lucky Store design system.
 *
 * To integrate Stitch MCP later:
 * 1. Fetch tokens from MCP: await mcp.stitch.getTokens()
 * 2. Map Stitch values to CSS variables: document.documentElement.style.setProperty('--stitch-primary', stitchTokens.colors.primary)
 * 3. CSS custom properties will automatically use Stitch values (see globals.css)
 */

import type { StitchTokenSet, StitchSemanticTokens } from './stitch-types';

// ============================================================================
// FALLBACK TOKEN VALUES (Current Lucky Store Design)
// ============================================================================

export const fallbackTokens: StitchTokenSet = {
  colors: {
    primary: '#D4A843',           // Gold
    primaryHover: '#c2983b',      // Gold dark
    primarySubtle: '#e8d5a3',     // Gold light
    primaryContrast: '#0F172A',   // Dark text on gold
    secondary: '#0B0D12',         // Charcoal
    secondaryHover: '#1a1d26',     // Charcoal light
    secondarySubtle: '#2d3142',    // Charcoal subtle
    secondaryContrast: '#FAFAFA',  // Light text on dark
    tertiary: '#8B7355',           // Warm brown
    neutral: {
      0: '#FFFFFF',
      50: '#FAFAFA',
      100: '#F5F0E8',    // Warm cream
      200: '#E8E0D5',    // Warm beige
      300: '#C4B5A0',    // Muted brown
      400: '#A89880',
      500: '#8B7355',    // Secondary text
      600: '#6B5A45',
      700: '#4A3D2F',
      800: '#2D261E',
      900: '#1a1a1a',    // Primary text
      1000: '#0B0D12',   // Charcoal
    },
    semantic: {
      success: '#10B981',
      successSubtle: '#DCFCE7',
      successText: '#166534',
      warning: '#F59E0B',
      warningSubtle: '#FEF3C7',
      warningText: '#92400E',
      danger: '#F43F5E',
      dangerSubtle: '#FFE4E6',
      dangerText: '#9F1239',
      info: '#3B82F6',
      infoSubtle: '#DBEAFE',
      infoText: '#1E40AF',
    },
  },

  typography: {
    fontFamily: {
      sans: "'Inter', system-ui, -apple-system, sans-serif",
      serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
      mono: "'Fira Code', 'Fira Mono', ui-monospace, monospace",
      display: "'Space Grotesk', 'Inter', sans-serif",
    },
    fontSize: {
      '2xs': '0.625rem',    // 10px
      xs: '0.75rem',        // 12px
      sm: '0.875rem',       // 14px
      base: '1rem',         // 16px
      lg: '1.125rem',       // 18px
      xl: '1.25rem',        // 20px
      '2xl': '1.5rem',      // 24px
      '3xl': '1.875rem',    // 30px
      '4xl': '2.25rem',     // 36px
      '5xl': '3rem',        // 48px
      '6xl': '3.75rem',     // 60px
    },
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  spacing: {
    '0': '0',
    '1': '0.25rem',     // 4px
    '2': '0.5rem',      // 8px
    '3': '0.75rem',     // 12px
    '4': '1rem',        // 16px
    '5': '1.25rem',     // 20px
    '6': '1.5rem',      // 24px
    '7': '1.75rem',     // 28px
    '8': '2rem',        // 32px
    '9': '2.25rem',     // 36px
    '10': '2.5rem',     // 40px
    '11': '2.75rem',    // 44px
    '12': '3rem',       // 48px
    '14': '3.5rem',     // 56px
    '16': '4rem',       // 64px
    '20': '5rem',       // 80px
    '24': '6rem',       // 96px
    '28': '7rem',       // 112px
    '32': '8rem',       // 128px
    '36': '9rem',       // 144px
    '40': '10rem',      // 160px
    '44': '11rem',      // 176px
    '48': '12rem',      // 192px
    '52': '13rem',      // 208px
    '56': '14rem',      // 224px
    '60': '15rem',      // 240px
    '64': '16rem',      // 256px
    '72': '18rem',      // 288px
    '80': '20rem',      // 320px
    '96': '24rem',      // 384px
  },

  elevation: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  borderRadius: {
    none: '0',
    sm: '0.375rem',     // 6px
    md: '0.5rem',       // 8px
    lg: '0.75rem',      // 12px
    xl: '1rem',         // 16px
    '2xl': '1.5rem',    // 24px
    '3xl': '2rem',      // 32px
    full: '9999px',
  },

  animation: {
    duration: {
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
};

// ============================================================================
// SEMANTIC TOKEN MAPPING
// ============================================================================

/**
 * Semantic tokens map primitive colors to meaningful use cases.
 * These are what components should use, not the primitive colors.
 */
export const semanticTokens: StitchSemanticTokens = {
  // Backgrounds
  'bg-canvas': 'var(--color-bg-canvas, #FAF7F2)',
  'bg-surface': 'var(--color-bg-surface, #FFFFFF)',
  'bg-surface-raised': 'var(--color-bg-surface-raised, #FFFFFF)',
  'bg-subtle': 'var(--color-bg-subtle, #F5F0E8)',
  'bg-muted': 'var(--color-bg-muted, #E8E0D5)',

  // Text
  'text-primary': 'var(--color-text-primary, #1a1a1a)',
  'text-secondary': 'var(--color-text-secondary, #6B5A45)',
  'text-tertiary': 'var(--color-text-tertiary, #8B7355)',
  'text-muted': 'var(--color-text-muted, #8B7355)',
  'text-disabled': 'var(--color-text-disabled, #C4B5A0)',
  'text-inverse': 'var(--color-text-inverse, #FAFAFA)',

  // Borders
  'border-default': 'var(--color-border-default, #E8E0D5)',
  'border-strong': 'var(--color-border-strong, #C4B5A0)',
  'border-subtle': 'var(--color-border-subtle, #F5F0E8)',
  'border-disabled': 'var(--color-border-disabled, #E8E0D5)',

  // Interactive
  'interactive-default': 'var(--color-primary, #D4A843)',
  'interactive-hover': 'var(--color-primary-hover, #c2983b)',
  'interactive-active': 'var(--color-primary, #D4A843)',
  'interactive-disabled': 'var(--color-neutral-300, #C4B5A0)',
  'interactive-focus': 'var(--color-primary, #D4A843)',

  // Status
  'status-success': 'var(--color-success, #10B981)',
  'status-warning': 'var(--color-warning, #F59E0B)',
  'status-danger': 'var(--color-danger, #F43F5E)',
  'status-info': 'var(--color-info, #3B82F6)',
};

// ============================================================================
// TOKEN CSS VARIABLE MAPPING
// ============================================================================

/**
 * Maps token names to CSS custom property names.
 * These are the variables used in globals.css and components.
 */
export const tokenToCssVar: Record<string, string> = {
  // Primary colors
  'color-primary': '--color-primary',
  'color-primary-hover': '--color-primary-hover',
  'color-primary-subtle': '--color-primary-subtle',
  'color-primary-contrast': '--color-primary-contrast',

  // Neutral colors
  'color-neutral-0': '--color-neutral-0',
  'color-neutral-50': '--color-neutral-50',
  'color-neutral-100': '--color-neutral-100',
  'color-neutral-200': '--color-neutral-200',
  'color-neutral-300': '--color-neutral-300',
  'color-neutral-400': '--color-neutral-400',
  'color-neutral-500': '--color-neutral-500',
  'color-neutral-600': '--color-neutral-600',
  'color-neutral-700': '--color-neutral-700',
  'color-neutral-800': '--color-neutral-800',
  'color-neutral-900': '--color-neutral-900',
  'color-neutral-1000': '--color-neutral-1000',

  // Semantic colors
  'color-success': '--color-success',
  'color-success-subtle': '--color-success-subtle',
  'color-success-text': '--color-success-text',
  'color-warning': '--color-warning',
  'color-warning-subtle': '--color-warning-subtle',
  'color-warning-text': '--color-warning-text',
  'color-danger': '--color-danger',
  'color-danger-subtle': '--color-danger-subtle',
  'color-danger-text': '--color-danger-text',
  'color-info': '--color-info',
  'color-info-subtle': '--color-info-subtle',
  'color-info-text': '--color-info-text',

  // Backgrounds
  'color-bg-canvas': '--color-bg-canvas',
  'color-bg-surface': '--color-bg-surface',
  'color-bg-surface-raised': '--color-bg-surface-raised',
  'color-bg-subtle': '--color-bg-subtle',

  // Text
  'color-text-primary': '--color-text-primary',
  'color-text-secondary': '--color-text-secondary',
  'color-text-muted': '--color-text-muted',

  // Border
  'color-border-default': '--color-border-default',
};

// ============================================================================
// STITCH INTEGRATION HELPERS
// ============================================================================

/**
 * Generates CSS custom property declarations from Stitch tokens.
 * Use this when fetching tokens from MCP.
 */
export function generateCssFromStitchTokens(tokens: Partial<StitchTokenSet>): string {
  const lines: string[] = [];

  if (tokens.colors) {
    lines.push('  /* Stitch Colors */');
    lines.push(`  --stitch-primary: ${tokens.colors.primary || fallbackTokens.colors.primary};`);
    lines.push(`  --stitch-primary-hover: ${tokens.colors.primaryHover || fallbackTokens.colors.primaryHover};`);
    lines.push(`  --stitch-secondary: ${tokens.colors.secondary || fallbackTokens.colors.secondary};`);

    if (tokens.colors.neutral) {
      Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
        lines.push(`  --stitch-neutral-${key}: ${value};`);
      });
    }
  }

  return lines.join('\n');
}

/**
 * Gets a CSS variable reference for a token.
 * Falls back to the default value if Stitch value is not available.
 */
export function getTokenCssVar(tokenName: keyof typeof semanticTokens): string {
  return semanticTokens[tokenName];
}

/**
 * Utility to create a class name with a token.
 * Example: tokenClass('bg', 'bg-canvas') → 'bg-[var(--color-bg-canvas,#FAF7F2)]'
 */
export function tokenClass(type: string, token: keyof typeof semanticTokens): string {
  const value = semanticTokens[token];
  // Extract the fallback value from the var() notation
  const match = value.match(/var\([^,]+,\s*([^)]+)\)/);
  const fallback = match ? match[1] : value;
  return `${type}-[${token.replace(/-/g, '-')}]`;
}
