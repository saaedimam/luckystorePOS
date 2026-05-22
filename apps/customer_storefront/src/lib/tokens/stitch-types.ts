/**
 * Stitch Design Token Types
 *
 * TypeScript definitions for Google Stitch design tokens.
 * These types define the structure expected from the Stitch MCP server.
 * When MCP is not available, we use the fallback values defined in token-map.ts
 */

// ============================================================================
// PRIMITIVE TOKENS
// ============================================================================

export interface StitchColorScale {
  0: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  1000: string;
}

export interface StitchSemanticColors {
  success: string;
  successSubtle: string;
  successText: string;
  warning: string;
  warningSubtle: string;
  warningText: string;
  danger: string;
  dangerSubtle: string;
  dangerText: string;
  info: string;
  infoSubtle: string;
  infoText: string;
}

export interface StitchColors {
  primary: string;
  primaryHover: string;
  primarySubtle: string;
  primaryContrast: string;
  secondary: string;
  secondaryHover: string;
  secondarySubtle: string;
  secondaryContrast: string;
  tertiary: string;
  neutral: StitchColorScale;
  semantic: StitchSemanticColors;
}

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export interface StitchFontFamilies {
  sans: string;
  serif: string;
  mono: string;
  display: string;
}

export interface StitchFontSizes {
  '2xs': string;
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

export interface StitchFontWeights {
  thin: number;
  extralight: number;
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
  black: number;
}

export interface StitchLineHeights {
  none: number;
  tight: number;
  snug: number;
  normal: number;
  relaxed: number;
  loose: number;
}

export interface StitchLetterSpacing {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
}

export interface StitchTypography {
  fontFamily: StitchFontFamilies;
  fontSize: StitchFontSizes;
  fontWeight: StitchFontWeights;
  lineHeight: StitchLineHeights;
  letterSpacing: StitchLetterSpacing;
}

// ============================================================================
// SPACING TOKENS
// ============================================================================

export interface StitchSpacing {
  '0': string;
  '1': string;
  '2': string;
  '3': string;
  '4': string;
  '5': string;
  '6': string;
  '7': string;
  '8': string;
  '9': string;
  '10': string;
  '11': string;
  '12': string;
  '14': string;
  '16': string;
  '20': string;
  '24': string;
  '28': string;
  '32': string;
  '36': string;
  '40': string;
  '44': string;
  '48': string;
  '52': string;
  '56': string;
  '60': string;
  '64': string;
  '72': string;
  '80': string;
  '96': string;
}

// ============================================================================
// ELEVATION (SHADOWS) TOKENS
// ============================================================================

export interface StitchElevation {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export interface StitchBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export interface StitchAnimationDurations {
  '75': string;
  '100': string;
  '150': string;
  '200': string;
  '300': string;
  '500': string;
  '700': string;
  '1000': string;
}

export interface StitchAnimationEasings {
  linear: string;
  in: string;
  out: string;
  inOut: string;
}

export interface StitchAnimation {
  duration: StitchAnimationDurations;
  easing: StitchAnimationEasings;
}

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

export interface StitchZIndex {
  hide: number;
  auto: string;
  base: number;
  docked: number;
  dropdown: number;
  sticky: number;
  banner: number;
  overlay: number;
  modal: number;
  popover: number;
  skipLink: number;
  toast: number;
  tooltip: number;
}

// ============================================================================
// COMPLETE TOKEN SET
// ============================================================================

export interface StitchTokenSet {
  colors: StitchColors;
  typography: StitchTypography;
  spacing: StitchSpacing;
  elevation: StitchElevation;
  borderRadius: StitchBorderRadius;
  animation: StitchAnimation;
  zIndex: StitchZIndex;
}

// ============================================================================
// SEMANTIC TOKEN MAPPING (What components should use)
// ============================================================================

export interface StitchSemanticTokens {
  // Backgrounds
  'bg-canvas': string;
  'bg-surface': string;
  'bg-surface-raised': string;
  'bg-subtle': string;
  'bg-muted': string;

  // Text
  'text-primary': string;
  'text-secondary': string;
  'text-tertiary': string;
  'text-muted': string;
  'text-disabled': string;
  'text-inverse': string;

  // Borders
  'border-default': string;
  'border-strong': string;
  'border-subtle': string;
  'border-disabled': string;

  // Interactive states
  'interactive-default': string;
  'interactive-hover': string;
  'interactive-active': string;
  'interactive-disabled': string;
  'interactive-focus': string;

  // Status
  'status-success': string;
  'status-warning': string;
  'status-danger': string;
  'status-info': string;
}

// ============================================================================
// TOKEN FETCH RESULT
// ============================================================================

export interface TokenFetchResult {
  tokens: Partial<StitchTokenSet>;
  error?: string;
  source: 'mcp' | 'fallback' | 'cache';
  timestamp: number;
}
