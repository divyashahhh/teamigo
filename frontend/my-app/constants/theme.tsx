/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// frontend/constants/theme.ts

export const Colors = {
  primary: '#6C63FF',
  secondary: '#B8B8FF',
  background: '#F5F7FA',
  darkBackground: '#1B1D2E',
  light: '#FFFFFF',
  muted: '#A1A5B7',
  accent: '#FFD86E',
  error: '#FF6B6B',
  success: '#32D48E',
  text: '#1A1A1A',
  subtitle: '#5C5F71',
  border: '#E4E6EF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

export const FontSizes = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const Radii = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 100,
};

export const Shadow = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
};
