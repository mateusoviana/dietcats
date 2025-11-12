import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User, RegisterData } from '../types';
import supabase from '../lib/supabase';
import debugSupabase from '../lib/supabaseDebug';
import { Platform } from 'react-native';

// Use debug version temporarily
const supabaseToUse = debugSupabase as any;

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 [DEBUG] AuthProvider useEffect INICIADO');
    console.log('🌍 [DEBUG] Platform:', Platform.OS);
    
    // On web, ensure we exchange any OAuth code in URL into a session (robust fallback)
    const maybeExchange = async () => {
      try {
        if (Platform.OS === 'web') {
          console.log('🌐 [DEBUG] Tentando exchangeCodeForSession...');
          
          // Add timeout
          const timeout = new Promise((_, reject) => 
            setTimeout(() => {
              console.log('⏱️ [DEBUG] exchangeCodeForSession TIMEOUT após 3s');
              reject(new Error('exchangeCodeForSession timeout'));
            }, 3000)
          );
          
          await Promise.race([
            supabase.auth.exchangeCodeForSession(window.location.href),
            timeout
          ]);
          console.log('✅ [DEBUG] exchangeCodeForSession completado');
        } else {
          console.log('📱 [DEBUG] Not web, skipping exchange');
        }
      } catch (e) {
        console.log('⚠️ [DEBUG] exchangeCodeForSession error (pode ser normal):', e);
      }
    };

    console.log('🔄 [DEBUG] Chamando maybeExchange...');
    maybeExchange().finally(() => {
      console.log('✅ [DEBUG] maybeExchange finalizado, chamando checkAuthState...');
      checkAuthState();
    });
    
    // Listen to auth changes - use session data directly instead of calling getSession again
    const { data: sub } = supabaseToUse.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('🔔 [DEBUG] Auth state changed:', event);
      
      // Only handle SIGNED_IN and SIGNED_OUT events
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ [DEBUG] User signed in, creating profile from session');
        const authUser = session.user;
        const profileUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: (authUser.user_metadata as any)?.name || '',
          userType: (authUser.user_metadata as any)?.user_type || 'patient',
          createdAt: authUser.created_at || new Date().toISOString(),
        };
        setUser(profileUser);
      } else if (event === 'SIGNED_OUT') {
        console.log('❌ [DEBUG] User signed out');
        setUser(null);
      }
      // Ignore other events like TOKEN_REFRESHED, USER_UPDATED to avoid unnecessary calls
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    console.log('🔍 [DEBUG] checkAuthState - START');
    try {
      console.log('📡 [DEBUG] Calling supabaseToUse.auth.getSession...');
      const { data } = await supabaseToUse.auth.getSession();
      if (data.session?.user) {
        const profileUser = await loadCurrentUser();
        setUser(profileUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentUser = async (): Promise<User | null> => {
    console.log('👤 [DEBUG] loadCurrentUser - START');
    const { data: sessionData } = await supabaseToUse.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, name, user_type, created_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }

    if (!profile) {
      return {
        id: authUser.id,
        email: authUser.email || '',
        name: '',
        userType: 'patient',
        createdAt: authUser.created_at || new Date().toISOString(),
      } as User;
    }

    // Backfill name from auth metadata if missing
    let name = profile.name || '';
    if (!name) {
      const metaName = (authUser.user_metadata as any)?.name || (authUser.user_metadata as any)?.full_name;
      if (metaName) {
        const { error: upErr } = await supabase
          .from('profiles')
          .update({ name: metaName, updated_at: new Date().toISOString() })
          .eq('id', authUser.id);
        if (!upErr) {
          name = metaName;
        }
      }
    }

    const user: User = {
      id: profile.id,
      email: profile.email || authUser.email || '',
      name,
      userType: (profile.user_type as User['userType']) || 'patient',
      createdAt: profile.created_at || authUser.created_at || new Date().toISOString(),
    };
    return user;
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 [DEBUG] Login iniciado...');
      const { data, error } = await supabaseToUse.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      console.log('✅ [DEBUG] Login bem-sucedido, pegando usuário da resposta...');
      const authUser = data?.user;
      
      if (!authUser) {
        console.log('❌ [DEBUG] Nenhum usuário na resposta do login');
        throw new Error('No user in login response');
      }
      
      console.log('👤 [DEBUG] Usuário autenticado:', authUser.email);
      
      // Create user object from auth response without calling getSession
      const profileUser: User = {
        id: authUser.id,
        email: authUser.email || email,
        name: (authUser.user_metadata as any)?.name || '',
        userType: (authUser.user_metadata as any)?.user_type || 'patient',
        createdAt: authUser.created_at || new Date().toISOString(),
      };
      
      console.log('💾 [DEBUG] Salvando usuário:', profileUser);
      await AsyncStorage.setItem('user', JSON.stringify(profileUser));
      setUser(profileUser);
      console.log('✅ [DEBUG] Login completo!');
    } catch (error) {
      console.error('❌ [DEBUG] Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const { email, password, name, userType } = userData;

      const redirectTo = typeof window !== 'undefined' && (window as any).location
        ? (window as any).location.origin
        : 'dietcats://auth/callback';

      const { data, error } = await supabaseToUse.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { name, user_type: userType },
        },
      });
      if (error) throw error;

      // If email confirmation is disabled, a session exists and profile is created via trigger.
      if (data.session && data.user) {
        console.log('✅ [DEBUG] Register bem-sucedido, criando usuário...');
        
        const profileUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: name,
          userType: userType,
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        
        console.log('💾 [DEBUG] Salvando usuário registrado:', profileUser);
        await AsyncStorage.setItem('user', JSON.stringify(profileUser));
        setUser(profileUser);
        console.log('✅ [DEBUG] Register completo!');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabaseToUse.auth.signOut();
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
