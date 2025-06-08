import { useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const colorScheme = _useColorScheme();
  return colorScheme ?? 'light';
}

// Theme colors from login/signup pages
export const lightTheme = {
  // Main backgrounds
  background: '#FFFFFF',
  darkBackground: '#002233',
  cardBackground: '#092A3D',
  inputBackground: '#10364A',
  
  // Text colors
  text: '#FFFFFF',
  subtitle: '#B0BEC5',
  muted: '#445E6B',
  
  // Brand colors
  primary: '#00AFAF',
  secondary: '#FFD700', // Gold accent
  accent: '#FFD86E',
  
  // Status colors
  error: '#FF4444',
  success: '#32D48E',
  warning: '#FFD700',
  
  // UI elements
  border: '#445E6B',
  divider: '#445E6B',
  icon: '#FFFFFF',
  
  // Component specific
  buttonText: '#FFFFFF',
  buttonBackground: '#00AFAF',
  inputBorder: '#445E6B',
  modalBackground: 'rgba(0, 34, 51, 0.9)'
};

export const darkTheme = {
  // Main backgrounds
  background: '#002233',
  darkBackground: '#002233',
  cardBackground: '#092A3D',
  inputBackground: '#10364A',
  
  // Text colors
  text: '#FFFFFF',
  subtitle: '#B0BEC5',
  muted: '#445E6B',
  
  // Brand colors
  primary: '#00AFAF',
  secondary: '#FFD700', // Gold accent
  accent: '#FFD86E',
  
  // Status colors
  error: '#FF4444',
  success: '#32D48E',
  warning: '#FFD700',
  
  // UI elements
  border: '#445E6B',
  divider: '#445E6B',
  icon: '#FFFFFF',
  
  // Component specific
  buttonText: '#FFFFFF',
  buttonBackground: '#00AFAF',
  inputBorder: '#445E6B',
  modalBackground: 'rgba(0, 34, 51, 0.9)'
}; 