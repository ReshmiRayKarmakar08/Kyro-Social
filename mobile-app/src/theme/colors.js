// Kyro Social Brand Design Tokens
// Ported from web-frontend/src/theme/theme.js

export const Colors = {
  primary: '#FF6154',
  primaryLight: '#FF8A80',
  primaryDark: '#E8451C',
  primaryGradientStart: '#FF6154',
  primaryGradientEnd: '#FF8A65',

  light: {
    background: '#F5F5F7',
    surface: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textCaption: '#9CA3AF',
    divider: 'rgba(0, 0, 0, 0.06)',
    inputBg: '#F3F4F6',
    cardShadow: 'rgba(45, 49, 66, 0.06)',
    secondary: '#2D3142',
    secondaryLight: '#4F5D75',
  },

  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textCaption: '#64748B',
    divider: 'rgba(255, 255, 255, 0.1)',
    inputBg: '#334155',
    cardShadow: 'rgba(0, 0, 0, 0.25)',
    secondary: '#94A3B8',
    secondaryLight: '#4F5D75',
  },

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
  full: 999,
};

export const Fonts = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extrabold: { fontWeight: '800' },
  sizes: {
    caption: 12,
    body2: 13,
    body1: 15,
    subtitle: 16,
    h6: 16,
    h5: 18,
    h4: 20,
    h3: 24,
    h2: 32,
    h1: 40,
  },
};

// Helper: get theme-aware colors
export const getColors = (isDark) => (isDark ? Colors.dark : Colors.light);
