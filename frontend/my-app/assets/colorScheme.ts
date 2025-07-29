import { useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const colorScheme = _useColorScheme();
  return colorScheme ?? 'light';
}

export const lightTheme = {
  background: '#FFFFFF',
  darkBackground: '#002233',
  cardBackground: '#092A3D',
  inputBackground: '#10364A',
  
  text: '#FFFFFF',
  subtitle: '#B0BEC5',
  muted: '#445E6B',
  
  primary: '#00AFAF',
  secondary: '#FFD700',
  accent: '#FFD86E',
  
  error: '#FF4444',
  success: '#32D48E',
  warning: '#FFD700',
  
  border: '#445E6B',
  divider: '#445E6B',
  icon: '#FFFFFF',
  
  buttonText: '#FFFFFF',
  buttonBackground: '#00AFAF',
  inputBorder: '#445E6B',
  modalBackground: 'rgba(0, 34, 51, 0.9)'
};

export const darkTheme = {
  background: '#002233',
  darkBackground: '#002233',
  cardBackground: '#092A3D',
  inputBackground: '#10364A',
  
  text: '#FFFFFF',
  subtitle: '#B0BEC5',
  muted: '#445E6B',
  
  primary: '#00AFAF',
  secondary: '#FFD700',
  accent: '#FFD86E',
  
  error: '#FF4444',
  success: '#32D48E',
  warning: '#FFD700',
  
  border: '#445E6B',
  divider: '#445E6B',
  icon: '#FFFFFF',
  
  buttonText: '#FFFFFF',
  buttonBackground: '#00AFAF',
  inputBorder: '#445E6B',
  modalBackground: 'rgba(0, 34, 51, 0.9)'
}; 