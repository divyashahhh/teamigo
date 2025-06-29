import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://vgjxjfidvgngvizraejo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnanhqZmlkdmduZ3ZpenJhZWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTY1OTAsImV4cCI6MjA2NjU3MjU5MH0.y6Fw5rVaKgXV-va9ig0bfsgjrZMcswA03F1ohDuEUZY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});