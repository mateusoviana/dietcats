import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User, RegisterData } from '../types';
import supabase from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { MealService } from '../services/MealService';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    checkAuthState();
    
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      sessionRef.current = session;
      
      if (event === 'SIGNED_IN' && session?.user) {
        const profileUser = await loadCurrentUser(session.user);
        setUser(profileUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      // Ignore TOKEN_REFRESHED and other events to avoid unnecessary calls
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      sessionRef.current = data.session;
      
      if (data.session?.user) {
        const profileUser = await loadCurrentUser(data.session.user);
        setUser(profileUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentUser = async (authUser: any): Promise<User | null> => {
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
    // Note: We don't update here to avoid RLS recursion issues
    // The trigger handle_user_updated will sync this automatically
    let name = profile.name || '';
    if (!name) {
      name = (authUser.user_metadata as any)?.name || (authUser.user_metadata as any)?.full_name || '';
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('No user in login response');
      }
      
      sessionRef.current = data.session;
      
      // Load full profile from database
      const profileUser = await loadCurrentUser(data.user);
      if (profileUser) {
        await AsyncStorage.setItem('user', JSON.stringify(profileUser));
        setUser(profileUser);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
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
      if (data.session && data.user) {
        sessionRef.current = data.session;
        
        const profileUser = await loadCurrentUser(data.user);
        if (profileUser) {
          await AsyncStorage.setItem('user', JSON.stringify(profileUser));
          setUser(profileUser);
        }
      }
    } catch (error) {
      throw error;
    } 
  };

  const updateProfile = async (data: { name: string; email: string }) => {
    if (!user) {
      throw new Error('Usuário não está logado');
    }

    const { name, email } = data;
    const updates: any = {};
    let emailChanged = false;

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      updates.email = email;
      emailChanged = true;
    }

    if (name && name !== user.name) {
      updates.data = { ...((user as any).user_metadata || {}), name };
    }

    if (Object.keys(updates).length > 0) {
      const { error: authError } = await supabase.auth.updateUser(updates);

      if (authError) {
        throw new Error(`Falha ao atualizar perfil no Auth: ${authError.message}`);
      }
    }

    const updatedUser: User = {
      ...user,
      name: name || user.name,
      email: email || user.email,
    };

    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

    if (emailChanged) {
      console.warn('O email foi alterado. O usuário precisará confirmar o novo endereço.');
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear all caches
      MealService.clearCache();
      sessionRef.current = null;
      
      // Set user to null immediately to trigger navigation reset
      setUser(null);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user');
      
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
