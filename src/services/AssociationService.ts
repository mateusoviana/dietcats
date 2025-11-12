import supabase from '../lib/supabase';

export interface AssociationResult {
  success: boolean;
  error?: string;
  nutritionistId?: string;
  nutritionistName?: string;
}

export class AssociationService {
  /**
   * Generate a new association code for the current nutritionist
   */
  async generateCode(): Promise<string> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    
    if (!uid) throw new Error('Não autenticado');
    
    // Call the database function to generate a unique code
    const { data, error } = await supabase.rpc('generate_association_code');
    
    if (error) throw error;
    
    const code = data as string;
    
    // Update the nutritionist's profile with the new code
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ association_code: code })
      .eq('id', uid);
    
    if (updateError) throw updateError;
    
    return code;
  }
  
  /**
   * Get the current association code for the logged-in nutritionist
   */
  async getMyCode(): Promise<string | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    
    if (!uid) throw new Error('Não autenticado');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('association_code')
      .eq('id', uid)
      .single();
    
    if (error) throw error;
    
    return data?.association_code || null;
  }
  
  /**
   * Associate current patient with a nutritionist using their code
   * Using direct queries instead of RPC to avoid authentication issues
   */
  async associateWithCode(code: string): Promise<AssociationResult> {
    console.log('🔵 [AssociationService] associateWithCode called with code:', code);
    
    if (!code || !code.trim()) {
      console.log('❌ [AssociationService] Code is empty');
      return { success: false, error: 'Código inválido' };
    }
    
    const trimmedCode = code.trim().toUpperCase();
    console.log('🔵 [AssociationService] Trimmed code:', trimmedCode);
    
    try {
      // Step 1: Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      console.log('🔵 [AssociationService] Current user ID:', uid);
      
      if (!uid) {
        console.log('❌ [AssociationService] User not authenticated');
        return { success: false, error: 'Não autenticado' };
      }
      
      // Step 2: Find nutritionist with this code
      console.log('🔵 [AssociationService] Searching for nutritionist with code:', trimmedCode);
      const { data: nutritionist, error: nutritionistError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('association_code', trimmedCode)
        .eq('user_type', 'nutritionist')
        .maybeSingle();
      
      console.log('🔵 [AssociationService] Nutritionist query result:', nutritionist);
      console.log('🔵 [AssociationService] Nutritionist query error:', nutritionistError);
      
      if (nutritionistError) {
        console.error('❌ [AssociationService] Error finding nutritionist:', nutritionistError);
        return { success: false, error: 'Erro ao buscar nutricionista' };
      }
      
      if (!nutritionist) {
        console.log('❌ [AssociationService] Nutritionist not found');
        return { success: false, error: 'Código inválido' };
      }
      
      console.log('✅ [AssociationService] Nutritionist found:', nutritionist.name);
      
      // Step 3: Update patient profile with nutritionist_id
      console.log('🔵 [AssociationService] Updating patient profile...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          nutritionist_id: nutritionist.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', uid)
        .eq('user_type', 'patient');
      
      console.log('🔵 [AssociationService] Update error:', updateError);
      
      if (updateError) {
        console.error('❌ [AssociationService] Error updating profile:', updateError);
        return { success: false, error: 'Erro ao associar' };
      }
      
      console.log('✅ [AssociationService] Association successful!');
      return {
        success: true,
        nutritionistId: nutritionist.id,
        nutritionistName: nutritionist.name
      };
    } catch (e) {
      console.error('💥 [AssociationService] Exception caught:', e);
      return { success: false, error: 'Exceção ao associar' };
    }
  }
  
  /**
   * Get the nutritionist associated with the current patient
   */
  async getMyNutritionist(): Promise<{ id: string; name: string; email: string } | null> {
    console.log('🔵 [AssociationService] getMyNutritionist called');
    
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    console.log('🔵 [AssociationService] User ID:', uid);
    
    if (!uid) {
      console.log('❌ [AssociationService] User not authenticated');
      throw new Error('Não autenticado');
    }
    
    console.log('🔵 [AssociationService] Fetching profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nutritionist_id')
      .eq('id', uid)
      .single();
    
    console.log('🔵 [AssociationService] Profile data:', profile);
    console.log('🔵 [AssociationService] Profile error:', profileError);
    
    if (profileError) {
      console.error('❌ [AssociationService] Profile error:', profileError);
      throw profileError;
    }
    
    if (!profile?.nutritionist_id) {
      console.log('ℹ️ [AssociationService] No nutritionist associated');
      return null;
    }
    
    console.log('🔵 [AssociationService] Fetching nutritionist with ID:', profile.nutritionist_id);
    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', profile.nutritionist_id)
      .single();
    
    console.log('🔵 [AssociationService] Nutritionist data:', nutritionist);
    console.log('🔵 [AssociationService] Nutritionist error:', nutritionistError);
    
    if (nutritionistError) {
      console.error('❌ [AssociationService] Nutritionist error:', nutritionistError);
      throw nutritionistError;
    }
    
    console.log('✅ [AssociationService] Nutritionist found:', nutritionist);
    return nutritionist;
  }
  
  /**
   * Get all patients associated with the current nutritionist
   */
  async getMyPatients(): Promise<Array<{ id: string; name: string; email: string }>> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    
    if (!uid) throw new Error('Não autenticado');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('nutritionist_id', uid)
      .eq('user_type', 'patient');
    
    if (error) throw error;
    
    return data || [];
  }
  
  /**
   * Remove association between current patient and their nutritionist
   */
  async removeAssociation(): Promise<void> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    
    if (!uid) throw new Error('Não autenticado');
    
    const { error } = await supabase
      .from('profiles')
      .update({ nutritionist_id: null })
      .eq('id', uid);
    
    if (error) throw error;
  }
}

export const associationService = new AssociationService();

