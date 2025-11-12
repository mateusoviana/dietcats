import supabase from '../lib/supabase';
import { MealCheckIn } from '../types';

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
  async getMyCheckIns(): Promise<MealCheckIn[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) throw new Error('Não autenticado');
    const uid = sessionData.session.user.id;
    const { data, error } = await supabase
      .from('meal_check_ins')
      .select('*')
      .eq('patient_id', uid)
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(fromDB);
  }

  async addCheckIn(input: NewMealCheckIn): Promise<MealCheckIn> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) throw new Error('Não autenticado');
    const payload = {
      patient_id: uid,
      meal_type: input.mealType,
      timestamp: input.timestamp ?? new Date().toISOString(),
      photo_url: input.photo ?? null,
      hunger_rating: input.hungerRating ?? null,
      satiety_rating: input.satietyRating ?? null,
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
    const { error } = await supabase.from('meal_check_ins').delete().eq('id', id);
    if (error) throw error;
  }

  async updateCheckIn(
    id: string,
    input: Partial<NewMealCheckIn>
  ): Promise<MealCheckIn> {
    const payload: any = {};
    if (input.mealType !== undefined) payload.meal_type = input.mealType;
    if (input.timestamp !== undefined) payload.timestamp = input.timestamp;
    if (input.photo !== undefined) payload.photo_url = input.photo;
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
