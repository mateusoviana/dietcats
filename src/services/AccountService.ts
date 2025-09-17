import supabase from '../lib/supabase';

class AccountService {
  async deleteAccount(): Promise<void> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Não autenticado');
    }

    const { error } = await supabase.functions.invoke('delete-account');
    if (error) {
      throw error;
    }
  }
}

export const accountService = new AccountService();

