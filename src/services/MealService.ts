import supabase from '../lib/supabase';
import { MealCheckIn } from '../types';
import { StorageService } from './StorageService';

export type NewMealCheckIn = {
  mealType: string;
  timestamp?: string; // ISO
  photo?: string;
  hungerRating?: number;
  satietyRating?: number;
  satisfactionRating?: number;
  tag?: string;
  observations?: string;
};

function fromDB(row: any): MealCheckIn {
  return {
    id: row.id,
    patientId: row.patient_id,
    mealType: row.meal_type,
    timestamp: row.timestamp ?? row.created_at,
    photo: row.photo_url ?? undefined,
    hungerRating: row.hunger_rating ?? 0,
    satietyRating: row.satiety_rating ?? 0,
    satisfactionRating: row.satisfaction_rating ?? 0,
    tag: row.tag ?? undefined,
    observations: row.observations ?? undefined,
  } as MealCheckIn;
}

export class MealService {
  // Cache the user ID to avoid repeated getSession calls
  private static cachedUserId: string | null = null;
  
  private static async getUserId(): Promise<string> {
    if (this.cachedUserId) {
      return this.cachedUserId;
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) throw new Error('Não autenticado');
    
    this.cachedUserId = uid;
    return uid;
  }
  
  // Clear cache on logout
  static clearCache(): void {
    this.cachedUserId = null;
  }
  
  async getMyCheckIns(): Promise<MealCheckIn[]> {
    await MealService.getUserId(); // Just to ensure we're authenticated
    const { data, error } = await supabase
      .from('meal_check_ins')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(fromDB);
  }

  async addCheckIn(input: NewMealCheckIn): Promise<MealCheckIn> {
    const uid = await MealService.getUserId();

    // Upload photo if it exists and is a local file
    let photoUrl = input.photo ?? null;
    if (input.photo) {
      try {
        photoUrl = await StorageService.uploadPhoto(input.photo, uid);
      } catch (error) {
        console.error('Photo upload failed:', error);
        // Continue without photo if upload fails
        photoUrl = null;
      }
    }

    const payload = {
      patient_id: uid,
      meal_type: input.mealType,
      timestamp: input.timestamp ?? new Date().toISOString(),
      photo_url: photoUrl,
      hunger_rating: input.hungerRating ?? null,
      satiety_rating: null, // Campo removido da UI, sempre null
      satisfaction_rating: input.satisfactionRating ?? null,
      tag: input.tag ?? null,
      observations: input.observations ?? null,
    };
    
    const { data, error } = await supabase
      .from('meal_check_ins')
      .insert(payload)
      .select('*')
      .single();
      
    if (error) throw error;
    return fromDB(data);
  }

  async deleteCheckIn(id: string): Promise<void> {
    // Get the check-in to delete its photo
    const { data: checkIn } = await supabase
      .from('meal_check_ins')
      .select('photo_url')
      .eq('id', id)
      .single();

    // Delete the check-in from database
    const { error } = await supabase.from('meal_check_ins').delete().eq('id', id);
    if (error) throw error;

    // Delete the photo from storage if it exists
    if (checkIn?.photo_url) {
      await StorageService.deletePhoto(checkIn.photo_url);
    }
  }

  async updateCheckIn(
    id: string,
    input: Partial<NewMealCheckIn>
  ): Promise<MealCheckIn> {
    const uid = await MealService.getUserId();

    const payload: any = {};
    if (input.mealType !== undefined) payload.meal_type = input.mealType;
    if (input.timestamp !== undefined) payload.timestamp = input.timestamp;
    
    // Handle photo update
    if (input.photo !== undefined) {
      if (input.photo) {
        try {
          // Upload new photo
          const newPhotoUrl = await StorageService.uploadPhoto(input.photo, uid);
          payload.photo_url = newPhotoUrl;

          // Delete old photo if it exists
          const { data: oldCheckIn } = await supabase
            .from('meal_check_ins')
            .select('photo_url')
            .eq('id', id)
            .single();
          
          if (oldCheckIn?.photo_url && oldCheckIn.photo_url !== newPhotoUrl) {
            await StorageService.deletePhoto(oldCheckIn.photo_url);
          }
        } catch (error) {
          console.error('Photo upload failed:', error);
        }
      } else {
        // User wants to remove photo
        payload.photo_url = null;
        
        // Delete old photo
        const { data: oldCheckIn } = await supabase
          .from('meal_check_ins')
          .select('photo_url')
          .eq('id', id)
          .single();
        
        if (oldCheckIn?.photo_url) {
          await StorageService.deletePhoto(oldCheckIn.photo_url);
        }
      }
    }
    
    if (input.hungerRating !== undefined) payload.hunger_rating = input.hungerRating;
    if (input.satietyRating !== undefined) payload.satiety_rating = input.satietyRating;
    if (input.satisfactionRating !== undefined)
      payload.satisfaction_rating = input.satisfactionRating;
    if (input.tag !== undefined) payload.tag = input.tag;
    if (input.observations !== undefined) payload.observations = input.observations;

    const { data, error } = await supabase
      .from('meal_check_ins')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return fromDB(data);
  }
}

export const mealService = new MealService();
