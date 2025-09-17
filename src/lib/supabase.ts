import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Read Supabase credentials from Expo extra
const extra = (Constants.expoConfig || (Constants as any).manifest)?.extra || {};
export const SUPABASE_URL: string | undefined = extra?.SUPABASE_URL;
export const SUPABASE_ANON_KEY: string | undefined = extra?.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // In development, it's helpful to log a warning if keys are missing
  console.warn(
    'Supabase keys are not set. Add SUPABASE_URL and SUPABASE_ANON_KEY to app.json -> expo.extra.'
  );
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

export default supabase;
