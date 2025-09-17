import supabase from '../lib/supabase';
import { Competition, ScoringCriteria } from '../types';

type CompetitionRow = any;

function mapCompetition(row: CompetitionRow): Competition {
  const participants: string[] = Array.isArray(row.competition_participants)
    ? row.competition_participants.map((p: any) => p.patient_id)
    : [];
  const scoring: ScoringCriteria | undefined = row.scoring_criteria
    ? (row.scoring_criteria as ScoringCriteria)
    : undefined;
  return {
    id: row.id,
    nutritionistId: row.nutritionist_id,
    name: row.name,
    description: row.description ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    participants,
    scoringCriteria: scoring || { checkInPoints: 0, consistencyBonus: 0, ratingBonus: 0 },
    createdAt: row.created_at,
  } as Competition;
}

export type CreateCompetitionInput = {
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  scoringCriteria?: ScoringCriteria;
};

export class CompetitionService {
  async createCompetition(input: CreateCompetitionInput): Promise<Competition> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) throw new Error('Não autenticado');

    const payload = {
      nutritionist_id: uid,
      name: input.name,
      description: input.description ?? null,
      start_date: input.startDate,
      end_date: input.endDate,
      scoring_criteria: input.scoringCriteria ?? null,
    };

    const { data, error } = await supabase
      .from('competitions')
      .insert(payload)
      .select('*, competition_participants(patient_id)')
      .single();
    if (error) throw error;
    return mapCompetition(data);
  }

  // Visible to current user by RLS (owner or participant)
  async listVisible(): Promise<Competition[]> {
    const { data, error } = await supabase
      .from('competitions')
      .select('*, competition_participants(patient_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCompetition);
  }

  // Owner-only: competitions where I am the nutritionist
  async listOwned(): Promise<Competition[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) throw new Error('Não autenticado');
    const { data, error } = await supabase
      .from('competitions')
      .select('*, competition_participants(patient_id)')
      .eq('nutritionist_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCompetition);
  }

  // Owner-only per RLS
  async addParticipant(competitionId: string, patientId: string): Promise<void> {
    const { error } = await supabase
      .from('competition_participants')
      .insert({ competition_id: competitionId, patient_id: patientId });
    if (error) throw error;
  }

  // Owner-only per RLS
  async removeParticipant(competitionId: string, patientId: string): Promise<void> {
    const { error } = await supabase
      .from('competition_participants')
      .delete()
      .eq('competition_id', competitionId)
      .eq('patient_id', patientId);
    if (error) throw error;
  }

  async getParticipants(competitionId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('competition_participants')
      .select('patient_id')
      .eq('competition_id', competitionId);
    if (error) throw error;
    return (data || []).map((r) => r.patient_id as string);
  }
}

export const competitionService = new CompetitionService();

