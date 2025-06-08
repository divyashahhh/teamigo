import { useColorScheme } from '@/assets/colorScheme';

export type ColorSchemeName = 'light' | 'dark';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof lightTheme & keyof typeof darkTheme
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  
  return theme === 'dark' ? darkTheme[colorName] : lightTheme[colorName];
} 