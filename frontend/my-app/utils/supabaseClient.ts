import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://colsacezboysbhijgwxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbHNhY2V6Ym95c2JoaWpnd3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTgyMzEsImV4cCI6MjA2NjM3NDIzMX0.ZjGr-ahjBGmfQl3JLDjog8-kTKB4Cs41MuRCGO5yj2I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, 
  },
});