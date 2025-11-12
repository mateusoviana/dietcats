import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Read Supabase credentials from Expo extra
const extra = (Constants.expoConfig || (Constants as any).manifest)?.extra || {};
export const SUPABASE_URL: string | undefined = extra?.SUPABASE_URL;
export const SUPABASE_ANON_KEY: string | undefined = extra?.SUPABASE_ANON_KEY;

console.log('🔧 [DEBUG] Supabase lib loaded - Time:', new Date().toISOString());
console.log('🔧 [DEBUG] Extra config:', {
  hasExtra: !!extra,
  extraKeys: Object.keys(extra),
});
console.log('🔧 [DEBUG] URL check:', {
  hasUrl: !!SUPABASE_URL,
  urlValue: SUPABASE_URL,
  urlLength: SUPABASE_URL?.length,
  urlType: typeof SUPABASE_URL,
  urlStartsWith: SUPABASE_URL?.substring(0, 10),
});
console.log('🔧 [DEBUG] Key check:', {
  hasKey: !!SUPABASE_ANON_KEY,
  keyLength: SUPABASE_ANON_KEY?.length,
  keyType: typeof SUPABASE_ANON_KEY,
  keyPrefix: SUPABASE_ANON_KEY?.substring(0, 20) + '...',
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ [DEBUG] Supabase keys are not set!');
} else {
  console.log('✅ [DEBUG] Supabase credentials present');
}

console.log('🏗️ [DEBUG] Creating Supabase client - Platform:', Platform.OS);

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

console.log('✅ [DEBUG] Supabase client created successfully');

export default supabase;
