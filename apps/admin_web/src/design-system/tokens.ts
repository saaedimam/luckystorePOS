export const colors = {
  brand: {
    gold: '#D4A843',
    emerald: '#10B981',
    rose: '#F43F5E',
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
};

export const typography = {
  fonts: {
    english: '"Inter", sans-serif',
    bangla: '"Hind Siliguri", sans-serif',
  },
  scale: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
};

export const componentVariants = {
  button: {
    default: {
      bg: colors.brand.gold,
      color: colors.neutral[900],
      border: 'none',
    },
    hover: {
      bg: '#C29837',
      color: colors.neutral[900],
      border: 'none',
    },
    active: {
      bg: '#B0882C',
      color: colors.neutral[900],
      border: 'none',
    },
    disabled: {
      bg: colors.neutral[200],
      color: colors.neutral[400],
      border: 'none',
    },
  },
  input: {
    default: {
      bg: colors.neutral[50],
      border: `1px solid ${colors.neutral[200]}`,
      color: colors.neutral[900],
    },
    focus: {
      bg: colors.neutral[50],
      border: `1px solid ${colors.brand.gold}`,
      color: colors.neutral[900],
    },
  },
  badge: {
    success: { bg: colors.brand.emerald, color: '#FFFFFF' },
    error: { bg: colors.brand.rose, color: '#FFFFFF' },
    warning: { bg: colors.brand.gold, color: colors.neutral[900] },
    neutral: { bg: colors.neutral[200], color: colors.neutral[800] },
  },
  productCard: {
    bg: '#FFFFFF',
    border: `1px solid ${colors.neutral[200]}`,
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderRadius: '0.75rem',
  },
  orderCard: {
    bg: '#FFFFFF',
    border: `1px solid ${colors.neutral[200]}`,
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    borderRadius: '1rem',
  },
};

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};
