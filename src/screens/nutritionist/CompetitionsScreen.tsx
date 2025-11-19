import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { competitionService } from '../../services/CompetitionService';
import { Competition } from '../../types';
import { NutritionistCompetitionsStackParamList } from '../../navigation/NutritionistCompetitionsStackNavigator';
import supabase from '../../lib/supabase';

type CompetitionsScreenNavigationProp = NativeStackNavigationProp<
  NutritionistCompetitionsStackParamList,
  'CompetitionsList'
>;

export default function CompetitionsScreen() {
  const navigation = useNavigation<CompetitionsScreenNavigationProp>();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompetitions();
  }, []);
  
  // Recarregar quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      loadCompetitions();
    }, [])
  );

  const loadCompetitions = async () => {
    try {
      console.log('🔄 [CompetitionsScreen] Loading competitions...');
      
      const data = await competitionService.listOwned();
      console.log('✅ [CompetitionsScreen] Loaded:', data.length, 'competitions');
      
      setCompetitions(data);
    } catch (e) {
      console.error('❌ [CompetitionsScreen] Error loading competitions:', e);
      setCompetitions([]);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCompetitions().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const renderCompetition = (competition: Competition) => (
    <Card key={competition.id} style={styles.competitionCard}>
      <View style={styles.competitionHeader}>
        <View style={styles.competitionTitleContainer}>
          <Text style={styles.competitionName}>{competition.name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: competition.isActive ? '#40916C' : '#9E9E9E' }
          ]}>
            <Text style={styles.statusBadgeText}>
              {competition.isActive ? 'ATIVA' : 'FINALIZADA'}
            </Text>
          </View>
        </View>
        <Text style={styles.competitionDescription}>{competition.description}</Text>
      </View>

      <View style={styles.competitionStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.statText}>{competition.participants.length} participantes</Text>
        </View>
        {competition.isActive && (
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              {getDaysRemaining(competition.endDate)} dias restantes
            </Text>
          </View>
        )}
      </View>

      <View style={styles.competitionFooter}>
        <Text style={styles.dateRange}>
          {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
        </Text>
        <View style={styles.competitionActions}>
          <Button
            title="Ver Detalhes"
            onPress={() => navigation.navigate('CompetitionDetails', { competitionId: competition.id })}
            variant="outline"
            style={styles.actionButton}
          />
          {competition.isActive && (
            <Button
              title="Editar"
              onPress={() => navigation.navigate('EditCompetition', { competitionId: competition.id })}
              variant="outline"
              style={styles.actionButton}
            />
          )}
        </View>
      </View>
    </Card>
  );

  const activeCompetitions = competitions.filter(c => new Date(c.endDate) > new Date());
  const totalParticipants = competitions.reduce((sum, c) => sum + c.participants.length, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Competições</Text>
        <Text style={styles.subtitle}>Gerencie suas competições</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statCardNumber}>{competitions.length}</Text>
            <Text style={styles.statCardLabel}>Total de Competições</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardNumber}>{activeCompetitions.length}</Text>
            <Text style={styles.statCardLabel}>Competições Ativas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardNumber}>{totalParticipants}</Text>
            <Text style={styles.statCardLabel}>Total de Participantes</Text>
          </View>
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo Geral</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{totalParticipants}</Text>
              <Text style={styles.summaryLabel}>Total de Participantes</Text>
            </View>
          </View>
        </Card>

        {competitions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Nenhuma competição encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Crie sua primeira competição para engajar seus pacientes.
            </Text>
            <Button
              title="Criar Competição"
              onPress={() => (navigation as any).navigate('CreateCompetition')}
              style={styles.createButton}
            />
          </Card>
        ) : (
          competitions.map(renderCompetition)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#40916C',
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
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#40916C',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#40916C',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#40916C',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  competitionCard: {
    marginBottom: 16,
  },
  competitionHeader: {
    marginBottom: 16,
  },
  competitionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  competitionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  competitionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  competitionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  competitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRange: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  competitionActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    marginLeft: 8,
  },
  editButton: {
    borderColor: '#2196F3',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    minWidth: 200,
  },
});
