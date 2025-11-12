// Debug wrapper for Supabase to log all calls
import supabase from './supabase';

const logCall = (method: string, args: any[]) => {
  const timestamp = new Date().toISOString();
  console.log(`🔵 [${timestamp}] [DEBUG] Supabase.${method} called with:`, args);
};

const logResult = (method: string, duration: number, result: any, error: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`🔴 [${timestamp}] [DEBUG] Supabase.${method} FAILED after ${duration}ms:`, error);
  } else {
    console.log(`🟢 [${timestamp}] [DEBUG] Supabase.${method} SUCCESS after ${duration}ms`);
  }
};

export const debugSupabase = {
  auth: {
    async getSession() {
      logCall('auth.getSession', []);
      const start = Date.now();
      try {
        // Add timeout to prevent hanging
        const timeout = new Promise((_, reject) => 
          setTimeout(() => {
            console.log('⏱️ [DEBUG] getSession TIMEOUT interno após 3s');
            reject(new Error('getSession internal timeout'));
          }, 3000)
        );
        
        console.log('🔄 [DEBUG] Iniciando supabase.auth.getSession() real...');
        const result = await Promise.race([
          supabase.auth.getSession(),
          timeout
        ]) as any;
        
        const duration = Date.now() - start;
        logResult('auth.getSession', duration, result, null);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logResult('auth.getSession', duration, null, error);
        console.log('💀 [DEBUG] getSession falhou, retornando sessão vazia');
        // Return empty session instead of throwing
        return { data: { session: null }, error: null };
      }
    },
    
    async signInWithPassword(credentials: { email: string; password: string }) {
      logCall('auth.signInWithPassword', [{ email: credentials.email, password: '***' }]);
      const start = Date.now();
      try {
        const result = await supabase.auth.signInWithPassword(credentials);
        const duration = Date.now() - start;
        logResult('auth.signInWithPassword', duration, result, null);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logResult('auth.signInWithPassword', duration, null, error);
        throw error;
      }
    },
    
    async signUp(data: any) {
      logCall('auth.signUp', [{ ...data, password: '***' }]);
      const start = Date.now();
      try {
        const result = await supabase.auth.signUp(data);
        const duration = Date.now() - start;
        logResult('auth.signUp', duration, result, null);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logResult('auth.signUp', duration, null, error);
        throw error;
      }
    },
    
    async signOut() {
      logCall('auth.signOut', []);
      const start = Date.now();
      try {
        const result = await supabase.auth.signOut();
        const duration = Date.now() - start;
        logResult('auth.signOut', duration, result, null);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logResult('auth.signOut', duration, null, error);
        throw error;
      }
    },
    
    onAuthStateChange: supabase.auth.onAuthStateChange.bind(supabase.auth),
    exchangeCodeForSession: supabase.auth.exchangeCodeForSession.bind(supabase.auth),
  },
  
  from: (table: string) => {
    console.log(`🔵 [DEBUG] Supabase.from('${table}') called`);
    return supabase.from(table);
  },
};

export default debugSupabase;

