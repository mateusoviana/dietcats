import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { competitionService } from '../../services/CompetitionService';
import { Competition } from '../../types';

export default function CompetitionsScreen() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      const data = await competitionService.listVisible();
      
      // Fetch scores for each competition
      const competitionsWithScores = await Promise.all(
        data.map(async (comp) => {
          try {
            const myScore = await competitionService.getMyScore(comp.id);
            return { ...comp, myScore: myScore || undefined };
          } catch (e) {
            return comp;
          }
        })
      );
      
      setCompetitions(competitionsWithScores);
    } catch (e) {
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

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const renderCompetition = (competition: Competition) => (
    <Card key={competition.id} style={styles.competitionCard}>
      <View style={styles.competitionHeader}>
        <View style={styles.competitionTitleContainer}>
          <Text style={styles.competitionName}>{competition.name}</Text>
          {new Date(competition.endDate) > new Date() && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ATIVA</Text>
            </View>
          )}
        </View>
        <Text style={styles.competitionDescription}>{competition.description}</Text>
      </View>

      <View style={styles.competitionStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.statText}>{competition.participants.length} participantes</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.statText}>
            {getDaysRemaining(competition.endDate)} dias restantes
          </Text>
        </View>
      </View>

      {/* Exibir pontuação do usuário */}
      {competition.myScore && (
        <View style={styles.userStats}>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatLabel}>Minha Pontuação</Text>
            <Text style={styles.userStatValue}>{competition.myScore.score} pts</Text>
          </View>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatLabel}>Check-ins</Text>
            <Text style={styles.userStatValue}>{competition.myScore.checkInCount}</Text>
          </View>
          {competition.myScore.rank && (
            <View style={styles.userStatItem}>
              <Text style={styles.userStatLabel}>Posição</Text>
              <Text style={styles.userStatValue}>{getPositionIcon(competition.myScore.rank)}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.competitionFooter}>
        <Text style={styles.dateRange}>
          {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
        </Text>
        <Button
          title="Ver Detalhes"
          onPress={() => {}}
          variant="outline"
          style={styles.detailsButton}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Competições</Text>
        <Text style={styles.subtitle}>Participe e ganhe pontos!</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {competitions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Nenhuma competição encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Seu nutricionista ainda não criou nenhuma competição.
            </Text>
            <Button
              title="Associar Nutricionista"
              onPress={() => {}}
              style={styles.associateButton}
            />
          </Card>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumo das Competições</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{competitions.length}</Text>
                  <Text style={styles.summaryLabel}>Competições Visíveis</Text>
                </View>
              </View>
            </Card>

            {competitions.map(renderCompetition)}
          </>
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
    color: '#E8F5E8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  activeBadge: {
    backgroundColor: '#40916C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
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
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  userStats: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  userStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  userStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#40916C',
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
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
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
  associateButton: {
    minWidth: 200,
  },
});
