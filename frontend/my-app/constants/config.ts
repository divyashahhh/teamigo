import Constants from 'expo-constants';

export const BACKEND_URL =
  Constants.manifest?.extra?.BACKEND_URL || 'http://localhost:5000';