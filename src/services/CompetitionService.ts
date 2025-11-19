import supabase from '../lib/supabase';
import { Competition, ScoringCriteria, CompetitionScore } from '../types';

type CompetitionRow = any;

function mapCompetition(row: CompetitionRow): Competition {
  const participants: string[] = Array.isArray(row.competition_participants)
    ? row.competition_participants.map((p: any) => p.patient_id)
    : [];
  const scoring: ScoringCriteria | undefined = row.scoring_criteria
    ? (row.scoring_criteria as ScoringCriteria)
    : undefined;
  
  const now = new Date();
  const startDate = new Date(row.start_date);
  const endDate = new Date(row.end_date);
  const isActive = now >= startDate && now <= endDate;
  
  return {
    id: row.id,
    nutritionistId: row.nutritionist_id,
    name: row.name,
    description: row.description ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    participants,
    scoringCriteria: scoring || { checkInPoints: 10, consistencyBonus: 0, ratingBonus: 5 },
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    allowSelfJoin: row.allow_self_join ?? false,
    isActive,
  } as Competition;
}

function mapCompetitionScore(row: any): CompetitionScore {
  return {
    competitionId: row.competition_id,
    patientId: row.patient_id,
    patientName: row.patient_name ?? undefined,
    score: row.score ?? 0,
    checkInCount: row.check_in_count ?? 0,
    lastCheckInDate: row.last_check_in_date ?? undefined,
  };
}

export type CreateCompetitionInput = {
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  scoringCriteria?: ScoringCriteria;
  allowSelfJoin?: boolean;
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
      allow_self_join: input.allowSelfJoin ?? false,
    };

    const { data, error } = await supabase
      .from('competitions')
      .insert(payload)
      .select('*, competition_participants(patient_id)')
      .single();
    if (error) throw error;
    return mapCompetition(data);
  }

  async updateCompetition(
    competitionId: string,
    updates: { name?: string; description?: string }
  ): Promise<Competition> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) throw new Error('Não autenticado');

    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      payload.name = updates.name;
    }
    if (updates.description !== undefined) {
      payload.description = updates.description || null;
    }

    const { data, error } = await supabase
      .from('competitions')
      .update(payload)
      .eq('id', competitionId)
      .eq('nutritionist_id', uid) // Só o dono pode editar
      .select('*, competition_participants(patient_id, joined_at)')
      .single();

    if (error) throw error;
    return mapCompetition(data);
  }

  // Visible to current user by RLS (owner or participant)
  async listVisible(): Promise<Competition[]> {
    const { data, error } = await supabase
      .from('competitions')
      .select('*, competition_participants(patient_id, joined_at)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCompetition);
  }

  // Owner-only: competitions where I am the nutritionist
  async listOwned(): Promise<Competition[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    
    console.log('🔍 [listOwned] Session UID:', uid);
    
    if (!uid) throw new Error('Não autenticado');
    
    const { data, error } = await supabase
      .from('competitions')
      .select('*, competition_participants(patient_id, joined_at)')
      .eq('nutritionist_id', uid)
      .order('created_at', { ascending: false });
    
    console.log('🔍 [listOwned] Query error:', error);
    console.log('🔍 [listOwned] Raw data:', data);
    console.log('🔍 [listOwned] Data count:', data?.length || 0);
    
    if (error) throw error;
    
    const mapped = (data || []).map(mapCompetition);
    console.log('🔍 [listOwned] Mapped competitions:', mapped.length);
    
    return mapped;
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

  // Get scores for a specific competition (leaderboard)
  async getLeaderboard(competitionId: string): Promise<CompetitionScore[]> {
    const { data, error } = await supabase
      .from('competition_scores')
      .select(`
        competition_id,
        patient_id,
        score,
        check_in_count,
        last_check_in_date,
        profiles:patient_id (name)
      `)
      .eq('competition_id', competitionId)
      .order('score', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map((row: any, index: number) => ({
      ...mapCompetitionScore(row),
      patientName: row.profiles?.name ?? 'Usuário',
      rank: index + 1,
    }));
  }

  // Get current user's score in a specific competition
  async getMyScore(competitionId: string): Promise<CompetitionScore | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('competition_scores')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('patient_id', uid)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    return mapCompetitionScore(data);
  }

  // Get all scores for current user across all competitions
  async getMyScores(): Promise<CompetitionScore[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('competition_scores')
      .select('*')
      .eq('patient_id', uid)
      .order('score', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(mapCompetitionScore);
  }

  // Get competition with scores included
  async getCompetitionWithScores(competitionId: string): Promise<Competition | null> {
    const { data, error } = await supabase
      .from('competitions')
      .select('*, competition_participants(patient_id, joined_at)')
      .eq('id', competitionId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    const competition = mapCompetition(data);
    
    // Fetch scores
    const scores = await this.getLeaderboard(competitionId);
    competition.scores = scores;
    
    // Fetch current user's score
    try {
      const myScore = await this.getMyScore(competitionId);
      if (myScore) {
        // Find rank in leaderboard
        const rank = scores.findIndex(s => s.patientId === myScore.patientId) + 1;
        competition.myScore = { ...myScore, rank: rank > 0 ? rank : undefined };
      }
    } catch (e) {
      // User might not be authenticated or not a participant
    }
    
    return competition;
  }
}

export const competitionService = new CompetitionService();