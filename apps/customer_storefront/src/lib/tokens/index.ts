/**
 * Tokens Library - Main Export
 *
 * This module provides design tokens for the Lucky Store storefront.
 * It supports Google Stitch tokens via MCP, with fallback to Lucky Store's
 * custom design system when Stitch is not available.
 *
 * @example
 * // Use semantic tokens in components
 * import { tokens } from '@/lib/tokens';
 *
 * // Get CSS variable reference
 * const primaryColor = tokens.colors.primary; // "var(--color-primary, #D4A843)"
 *
 * // Use semantic tokens
 * <div className="bg-bg-canvas text-text-primary" />
 *
 * @example
 * // Runtime token access (for dynamic theming)
 * import { getCssVariableValue } from '@/lib/tokens';
 * const gold = getCssVariableValue('--color-primary');
 */

// Export types
export type {
  StitchTokenSet,
  StitchSemanticTokens,
  StitchColors,
  StitchSemanticColors,
  StitchColorScale,
  StitchTypography,
  StitchSpacing,
  StitchElevation,
  StitchBorderRadius,
  StitchZIndex,
  TokenFetchResult,
} from './stitch-types';

// Export token maps and utilities
export {
  fallbackTokens,
  semanticTokens,
  tokenToCssVar,
  generateCssFromStitchTokens,
  getTokenCssVar,
  tokenClass,
} from './token-map';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * All design tokens organized by category.
 * These are CSS variable references (e.g., "var(--color-primary, #D4A843)")
 * Use them when you need to reference tokens in JavaScript.
 */
export const tokens = {
  colors: {
    // Primary
    primary: 'var(--color-primary, #D4A843)',
    primaryHover: 'var(--color-primary-hover, #c2983b)',
    primarySubtle: 'var(--color-primary-subtle, #e8d5a3)',
    primaryContrast: 'var(--color-primary-contrast, #0F172A)',

    // Neutral scale
    neutral: {
      0: 'var(--color-neutral-0, #FFFFFF)',
      50: 'var(--color-neutral-50, #FAFAFA)',
      100: 'var(--color-neutral-100, #F5F0E8)',
      200: 'var(--color-neutral-200, #E8E0D5)',
      300: 'var(--color-neutral-300, #C4B5A0)',
      400: 'var(--color-neutral-400, #A89880)',
      500: 'var(--color-neutral-500, #8B7355)',
      600: 'var(--color-neutral-600, #6B5A45)',
      700: 'var(--color-neutral-700, #4A3D2F)',
      800: 'var(--color-neutral-800, #2D261E)',
      900: 'var(--color-neutral-900, #1a1a1a)',
      1000: 'var(--color-neutral-1000, #0B0D12)',
    },

    // Semantic
    success: 'var(--color-success, #10B981)',
    successSubtle: 'var(--color-success-subtle, #DCFCE7)',
    successText: 'var(--color-success-text, #166534)',
    warning: 'var(--color-warning, #F59E0B)',
    warningSubtle: 'var(--color-warning-subtle, #FEF3C7)',
    warningText: 'var(--color-warning-text, #92400E)',
    danger: 'var(--color-danger, #F43F5E)',
    dangerSubtle: 'var(--color-danger-subtle, #FFE4E6)',
    dangerText: 'var(--color-danger-text, #9F1239)',
    info: 'var(--color-info, #3B82F6)',
  },

  // Semantic background tokens
  background: {
    canvas: 'var(--color-bg-canvas, #FAF7F2)',
    surface: 'var(--color-bg-surface, #FFFFFF)',
    surfaceRaised: 'var(--color-bg-surface-raised, #FFFFFF)',
    subtle: 'var(--color-bg-subtle, #F5F0E8)',
    muted: 'var(--color-bg-muted, #E8E0D5)',
  },

  // Semantic text tokens
  text: {
    primary: 'var(--color-text-primary, #1a1a1a)',
    secondary: 'var(--color-text-secondary, #6B5A45)',
    tertiary: 'var(--color-text-tertiary, #8B7355)',
    muted: 'var(--color-text-muted, #8B7355)',
    disabled: 'var(--color-text-disabled, #C4B5A0)',
    inverse: 'var(--color-text-inverse, #FAFAFA)',
  },

  // Semantic border tokens
  border: {
    default: 'var(--color-border-default, #E8E0D5)',
    strong: 'var(--color-border-strong, #C4B5A0)',
    subtle: 'var(--color-border-subtle, #F5F0E8)',
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the computed value of a CSS variable.
 * Useful for runtime access to token values.
 *
 * @param variableName - The CSS variable name (e.g., '--color-primary')
 * @param element - Optional element to read from (defaults to document.body)
 * @returns The computed value or null if not found
 *
 * @example
 * const goldColor = getCssVariable('--color-primary');
 * // Returns: '#D4A843' (or Stitch value if available)
 */
export function getCssVariable(
  variableName: string,
  element: HTMLElement = document.body
): string | null {
  if (typeof window === 'undefined') return null;
  const value = getComputedStyle(element).getPropertyValue(variableName).trim();
  return value || null;
}

/**
 * Sets a CSS variable value dynamically.
 * Useful for runtime theming or applying Stitch tokens.
 *
 * @param variableName - The CSS variable name (e.g., '--stitch-primary')
 * @param value - The value to set
 * @param element - Optional element to set on (defaults to document.documentElement)
 *
 * @example
 * setCssVariable('--stitch-primary', '#FF0000');
 */
export function setCssVariable(
  variableName: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  if (typeof window === 'undefined') return;
  element.style.setProperty(variableName, value);
}

/**
 * Batch updates multiple CSS variables.
 * Useful for applying a complete Stitch theme at once.
 *
 * @param variables - Object of variable names to values
 *
 * @example
 * applyTheme({
 *   '--stitch-primary': '#FF0000',
 *   '--stitch-secondary': '#00FF00',
 * });
 */
export function applyTheme(variables: Record<string, string>): void {
  Object.entries(variables).forEach(([name, value]) => {
    setCssVariable(name, value);
  });
}

/**
 * Resets CSS variables to their default values.
 * Useful when switching back from Stitch to default theme.
 */
export function resetTheme(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.cssText = '';
}

// ============================================================================
// TAILWIND CLASS HELPERS
// ============================================================================

/**
 * Common Tailwind class combinations using semantic tokens.
 * These follow the pattern used in the codebase.
 */
export const classes = {
  // Card patterns
  card: {
    base: 'bg-bg-surface border border-border-default',
    stacked: 'flex gap-3 p-3 bg-bg-surface rounded-xl border border-border-default',
    hover: 'hover:border-border-strong transition-colors',
  },

  // Button patterns
  button: {
    primary: 'bg-primary text-primary-contrast hover:bg-primary-hover',
    secondary: 'bg-bg-surface border border-border-default text-text-secondary hover:border-border-strong',
    ghost: 'hover:bg-bg-subtle text-text-secondary',
  },

  // Text patterns
  text: {
    heading: 'text-text-primary font-bold',
    body: 'text-text-secondary',
    muted: 'text-text-muted',
    price: 'text-text-primary font-bold tabular-nums',
  },

  // Status patterns
  status: {
    success: 'bg-success-subtle text-success-text border border-success',
    warning: 'bg-warning-subtle text-warning-text border border-warning',
    danger: 'bg-danger-subtle text-danger-text border border-danger',
  },
} as const;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default tokens;
