import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://xticecfgdlnzfqkkbfif.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0aWNlY2ZnZGxuemZxa2tiZmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNzYxMjIsImV4cCI6MjA2Njg1MjEyMn0.xkg7VJxhtGyaN_BS6JBcp3ma7hnSQW7MIpz0YM8QB7M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});