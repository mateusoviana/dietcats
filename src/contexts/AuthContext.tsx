import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User, RegisterData } from '../types';
import supabase from '../lib/supabase';
import { Platform } from 'react-native';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profileUser = await loadCurrentUser();
        setUser(profileUser);
      } else {
        setUser(null);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const { data } = await supabase.auth.getSession();
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
    const { data: sessionData } = await supabase.auth.getSession();
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const profileUser = await loadCurrentUser();
      if (profileUser) {
        await AsyncStorage.setItem('user', JSON.stringify(profileUser));
        setUser(profileUser);
      }
    } catch (error) {
      throw error;
    } finally {
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const { email, password, name, userType } = userData;

      const redirectTo = typeof window !== 'undefined' && (window as any).location
        ? (window as any).location.origin
        : 'dietcats://auth/callback';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { name, user_type: userType },
        },
      });
      if (error) throw error;

      // If email confirmation is disabled, a session exists and profile is created via trigger.
      if (data.session) {
        const profileUser = await loadCurrentUser();
        if (profileUser) {
          await AsyncStorage.setItem('user', JSON.stringify(profileUser));
          setUser(profileUser);
        }
      }
    } catch (error) {
      throw error;
    } 
  };

    // --- NOVA FUNÇÃO ADICIONADA ---
  const updateProfile = async (data: { name: string; email: string }) => {
    if (!user) throw new Error("Usuário não está logado");

    const { name, email } = data;
    
    // 1. Atualizar o email no Supabase Auth (se mudou)
    // Isso (geralmente) envia um email de confirmação
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) {
        throw new Error(`Falha ao atualizar email: ${authError.message}`);
      }
      // Nota: O email no 'user' só será atualizado após a confirmação.
      // Por agora, vamos atualizar o estado local
    }

    // 2. Atualizar o nome na tabela 'profiles' (se mudou)
    if (name && name !== user.name) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: name, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (profileError) {
        throw new Error(`Falha ao atualizar nome: ${profileError.message}`);
      }
    }

    // 3. Atualizar o estado local para reflexo imediato na UI
    const updatedUser: User = {
      ...user,
      name: name || user.name,
      email: email || user.email, // Atualiza localmente, mesmo que a confirmação esteja pendente
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };
  // --- FIM DA NOVA FUNÇÃO ---

  const logout = async () => {
    try {
      console.log('Logout iniciado');
      setIsLoading(true);
      
      // Set user to null immediately to trigger navigation reset
      setUser(null);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user');
      
      console.log('Logout concluído');
      
      // Small delay to ensure state is updated before navigation resets
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error logging out:', error);
      // Ensure user is set to null even if there's an error
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile, 
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
