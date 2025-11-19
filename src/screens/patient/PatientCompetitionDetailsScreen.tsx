import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Card from '../../components/Card';
import { competitionService } from '../../services/CompetitionService';
import { mealService } from '../../services/MealService';
import { useAuth } from '../../contexts/AuthContext';
import { Competition, CompetitionScore } from '../../types';
import { PatientCompetitionsStackParamList } from '../../navigation/PatientCompetitionsStackNavigator';

type CompetitionDetailsRouteProp = RouteProp<PatientCompetitionsStackParamList, 'CompetitionDetails'>;

export default function PatientCompetitionDetailsScreen() {
  const route = useRoute<CompetitionDetailsRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { competitionId } = route.params;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<CompetitionScore[]>([]);
  const [myScore, setMyScore] = useState<CompetitionScore | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitionDetails();
  }, [competitionId]);

  const loadCompetitionDetails = async () => {
    try {
      setLoading(true);
      
      const comp = await competitionService.getCompetitionWithScores(competitionId);
      
      if (!comp) {
        Alert.alert('Erro', 'Competição não encontrada');
        navigation.goBack();
        return;
      }
      
      setCompetition(comp);
      
      // Calcular pontuação padrão para todos os participantes
      const scores = await calculateStandardScores(comp.participants);
      setLeaderboard(scores);
      
      // Encontrar minha pontuação
      if (user?.id) {
        const myScoreData = scores.find(s => s.patientId === user.id);
        setMyScore(myScoreData || null);
      }
    } catch (error) {
      console.error('❌ Error loading competition:', error);
      Alert.alert('Erro', 'Não foi possível carregar a competição');
    } finally {
      setLoading(false);
    }
  };

  const calculateStandardScores = async (participantIds: string[]): Promise<CompetitionScore[]> => {
    try {
      const scoresPromises = participantIds.map(async (patientId) => {
        try {
          const checkIns = await mealService.getPatientCheckIns(patientId);
          
          const totalPoints = checkIns.reduce((sum, checkIn) => {
            const checkInPoints = 
              (checkIn.hungerRating || 0) + 
              (checkIn.satietyRating || 0) + 
              (checkIn.satisfactionRating || 0);
            return sum + checkInPoints;
          }, 0);

          return {
            competitionId,
            patientId,
            patientName: 'Participante',
            score: totalPoints,
            checkInCount: checkIns.length,
            lastCheckInDate: checkIns[0]?.timestamp || undefined,
          };
        } catch (error) {
          return {
            competitionId,
            patientId,
            patientName: 'Participante',
            score: 0,
            checkInCount: 0,
          };
        }
      });

      const scores = await Promise.all(scoresPromises);
      
      const sortedScores = scores
        .sort((a, b) => b.score - a.score)
        .map((score, index) => ({
          ...score,
          rank: index + 1,
        }));

      return sortedScores;
    } catch (error) {
      console.error('Error calculating standard scores:', error);
      return [];
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCompetitionDetails().finally(() => {
      setRefreshing(false);
    });
  }, [competitionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getMedalEmoji = (rank?: number) => {
    if (!rank) return '';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!competition) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Competição não encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{competition.name}</Text>
          <Text style={styles.subtitle}>
            {competition.isActive ? '🟢 Ativa' : '⚫ Finalizada'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Minha Pontuação */}
        {myScore && (
          <Card style={styles.myScoreCard}>
            <Text style={styles.sectionTitle}>Minha Pontuação</Text>
            <View style={styles.myScoreContent}>
              <View style={styles.myScoreItem}>
                <Text style={styles.myScoreLabel}>Posição</Text>
                <Text style={styles.myScoreValue}>
                  {getMedalEmoji(myScore.rank)} #{myScore.rank}
                </Text>
              </View>
              <View style={styles.myScoreItem}>
                <Text style={styles.myScoreLabel}>Pontos</Text>
                <Text style={styles.myScoreValue}>{myScore.score} pts</Text>
              </View>
              <View style={styles.myScoreItem}>
                <Text style={styles.myScoreLabel}>Check-ins</Text>
                <Text style={styles.myScoreValue}>{myScore.checkInCount}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Informações da Competição */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#40916C" />
            <Text style={styles.infoText}>
              Período: {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
            </Text>
          </View>
          {competition.description && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color="#40916C" />
              <Text style={styles.infoText}>{competition.description}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#40916C" />
            <Text style={styles.infoText}>
              {competition.participants.length} participante(s)
            </Text>
          </View>
        </Card>

        {/* Ranking/Leaderboard */}
        <Card style={styles.leaderboardCard}>
          <Text style={styles.sectionTitle}>Ranking</Text>

          {leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum check-in registrado ainda</Text>
          ) : (
            leaderboard.map((score, index) => {
              const isMe = score.patientId === user?.id;
              return (
                <View 
                  key={score.patientId} 
                  style={[
                    styles.leaderboardItem,
                    isMe && styles.leaderboardItemHighlight
                  ]}
                >
                  <View style={styles.leaderboardLeft}>
                    <Text style={styles.rankText}>
                      {getMedalEmoji(score.rank || index + 1)} #{score.rank || index + 1}
                    </Text>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>
                        {isMe ? 'Você' : score.patientName}
                      </Text>
                      <Text style={styles.playerStats}>
                        {score.checkInCount} check-ins
                      </Text>
                    </View>
                  </View>
                  <View style={styles.leaderboardRight}>
                    <Text style={styles.scoreText}>{score.score} pts</Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#40916C',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#D8F3DC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  myScoreCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#D8F3DC',
  },
  myScoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  myScoreItem: {
    alignItems: 'center',
  },
  myScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  myScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#40916C',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  leaderboardCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    paddingVertical: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderRadius: 8,
  },
  leaderboardItemHighlight: {
    backgroundColor: '#D8F3DC',
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    width: 60,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  playerStats: {
    fontSize: 14,
    color: '#999',
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#40916C',
  },
});

