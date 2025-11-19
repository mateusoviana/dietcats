import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { competitionService } from '../../services/CompetitionService';
import { associationService } from '../../services/AssociationService';
import { Competition, CompetitionScore, NutritionistStackParamList } from '../../types';

type CompetitionDetailsRouteProp = RouteProp<NutritionistStackParamList, 'CompetitionDetails'>;

export default function CompetitionDetailsScreen() {
  const route = useRoute<CompetitionDetailsRouteProp>();
  const navigation = useNavigation();
  const { competitionId } = route.params;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<CompetitionScore[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addParticipantModalVisible, setAddParticipantModalVisible] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<Array<{ id: string; name: string; email: string }>>([]);

  useEffect(() => {
    loadCompetitionDetails();
  }, [competitionId]);

  const loadCompetitionDetails = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading competition details for:', competitionId);
      
      const comp = await competitionService.getCompetitionWithScores(competitionId);
      
      if (!comp) {
        Alert.alert('Erro', 'Competição não encontrada');
        navigation.goBack();
        return;
      }
      
      setCompetition(comp);
      setLeaderboard(comp.scores || []);
      
      console.log('✅ Competition loaded:', comp);
      console.log('📊 Leaderboard:', comp.scores);
    } catch (error) {
      console.error('❌ Error loading competition:', error);
      Alert.alert('Erro', 'Não foi possível carregar a competição');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePatients = async () => {
    try {
      const allPatients = await associationService.getMyPatients();
      const participantIds = competition?.participants || [];
      const available = allPatients.filter(p => !participantIds.includes(p.id));
      setAvailablePatients(available);
    } catch (error) {
      console.error('❌ Error loading available patients:', error);
    }
  };

  const handleAddParticipant = async (patientId: string) => {
    try {
      await competitionService.addParticipant(competitionId, patientId);
      Alert.alert('Sucesso', 'Participante adicionado!');
      setAddParticipantModalVisible(false);
      loadCompetitionDetails();
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o participante');
    }
  };

  const handleRemoveParticipant = (patientId: string, patientName: string) => {
    Alert.alert(
      'Remover Participante',
      `Deseja remover ${patientName} desta competição?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await competitionService.removeParticipant(competitionId, patientId);
              Alert.alert('Sucesso', 'Participante removido!');
              loadCompetitionDetails();
            } catch (error) {
              console.error('❌ Error removing participant:', error);
              Alert.alert('Erro', 'Não foi possível remover o participante');
            }
          },
        },
      ]
    );
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

        {/* Pontuação */}
        <Card style={styles.scoringCard}>
          <Text style={styles.sectionTitle}>Critérios de Pontuação</Text>
          <View style={styles.scoringRow}>
            <Text style={styles.scoringLabel}>Check-in:</Text>
            <Text style={styles.scoringValue}>
              {competition.scoringCriteria.checkInPoints} pontos
            </Text>
          </View>
          <View style={styles.scoringRow}>
            <Text style={styles.scoringLabel}>Consistência (7 dias):</Text>
            <Text style={styles.scoringValue}>
              +{competition.scoringCriteria.consistencyBonus || 5} pontos bônus
            </Text>
          </View>
          <View style={styles.scoringRow}>
            <Text style={styles.scoringLabel}>Avaliações altas (4-5 ⭐):</Text>
            <Text style={styles.scoringValue}>
              +{competition.scoringCriteria.ratingBonus || 2} pontos bônus
            </Text>
          </View>
        </Card>

        {/* Ranking/Leaderboard */}
        <Card style={styles.leaderboardCard}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.sectionTitle}>Ranking</Text>
            {competition.isActive && (
              <TouchableOpacity
                onPress={() => {
                  loadAvailablePatients();
                  setAddParticipantModalVisible(true);
                }}
              >
                <Ionicons name="person-add-outline" size={24} color="#40916C" />
              </TouchableOpacity>
            )}
          </View>

          {leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum check-in registrado ainda</Text>
          ) : (
            leaderboard.map((score, index) => (
              <View key={score.patientId} style={styles.leaderboardItem}>
                <View style={styles.leaderboardLeft}>
                  <Text style={styles.rankText}>
                    {getMedalEmoji(score.rank || index + 1)} #{score.rank || index + 1}
                  </Text>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{score.patientName || 'Usuário'}</Text>
                    <Text style={styles.playerStats}>
                      {score.checkInCount} check-ins
                    </Text>
                  </View>
                </View>
                <View style={styles.leaderboardRight}>
                  <Text style={styles.scoreText}>{score.score} pts</Text>
                  {competition.isActive && (
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveParticipant(score.patientId, score.patientName || 'Usuário')
                      }
                    >
                      <Ionicons name="remove-circle-outline" size={20} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Modal para adicionar participantes */}
      <Modal
        visible={addParticipantModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddParticipantModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Participante</Text>
              <TouchableOpacity onPress={() => setAddParticipantModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {availablePatients.length === 0 ? (
                <Text style={styles.emptyText}>Todos os pacientes já estão participando</Text>
              ) : (
                availablePatients.map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    style={styles.patientItem}
                    onPress={() => handleAddParticipant(patient.id)}
                  >
                    <View>
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <Text style={styles.patientEmail}>{patient.email}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color="#40916C" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  infoCard: {
    margin: 16,
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
  scoringCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  scoringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoringLabel: {
    fontSize: 16,
    color: '#666',
  },
  scoringValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#40916C',
  },
  leaderboardCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#40916C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#999',
  },
});

