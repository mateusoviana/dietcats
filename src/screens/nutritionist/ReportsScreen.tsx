import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import Card from '../../components/Card';
import { associationService } from '../../services/AssociationService';
import { mealService } from '../../services/MealService';

interface PatientScore {
  id: string;
  name: string;
  totalPoints: number;
  checkIns: number;
}

export default function ReportsScreen() {
  const [patientScores, setPatientScores] = useState<PatientScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [averagePoints, setAveragePoints] = useState(0);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Buscar pacientes
      const patients = await associationService.getMyPatients();
      
      if (patients.length === 0) {
        setPatientScores([]);
        setLoading(false);
        return;
      }

      // Calcular pontuação para cada paciente
      const scoresPromises = patients.map(async (patient) => {
        try {
          const checkIns = await mealService.getPatientCheckIns(patient.id);
          
          const totalPoints = checkIns.reduce((sum, checkIn) => {
            const checkInPoints = 
              (checkIn.hungerRating || 0) + 
              (checkIn.satietyRating || 0) + 
              (checkIn.satisfactionRating || 0);
            return sum + checkInPoints;
          }, 0);

          return {
            id: patient.id,
            name: patient.name || 'Sem nome',
            totalPoints,
            checkIns: checkIns.length,
          };
        } catch (error) {
          return {
            id: patient.id,
            name: patient.name || 'Sem nome',
            totalPoints: 0,
            checkIns: 0,
          };
        }
      });

      const scores = await Promise.all(scoresPromises);
      
      // Ordenar por pontuação
      const sortedScores = scores.sort((a, b) => b.totalPoints - a.totalPoints);
      setPatientScores(sortedScores);

      // Calcular estatísticas gerais
      const totalChecks = sortedScores.reduce((sum, p) => sum + p.checkIns, 0);
      const avgPoints = sortedScores.length > 0 
        ? sortedScores.reduce((sum, p) => sum + p.totalPoints, 0) / sortedScores.length 
        : 0;
      
      setTotalCheckIns(totalChecks);
      setAveragePoints(Math.round(avgPoints));
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadReports().finally(() => {
      setRefreshing(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#40916C" />
        <Text style={styles.loadingText}>Carregando relatórios...</Text>
      </View>
    );
  }

  if (patientScores.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatórios</Text>
          <Text style={styles.subtitle}>Análises e estatísticas</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Nenhum paciente encontrado</Text>
          <Text style={styles.emptySubtitle}>
            Associe pacientes para visualizar relatórios
          </Text>
        </View>
      </View>
    );
  }

  // Preparar dados para o gráfico de barras
  const chartData = {
    labels: patientScores.slice(0, 5).map(p => {
      const firstName = p.name.split(' ')[0];
      return firstName.length > 8 ? firstName.substring(0, 8) : firstName;
    }),
    datasets: [
      {
        data: patientScores.slice(0, 5).map(p => p.totalPoints),
      },
    ],
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
        <Text style={styles.subtitle}>Análises e estatísticas</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Estatísticas Gerais */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons name="people" size={32} color="#40916C" />
            <Text style={styles.statNumber}>{patientScores.length}</Text>
            <Text style={styles.statLabel}>Pacientes</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="restaurant" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{totalCheckIns}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="star" size={32} color="#FFD700" />
            <Text style={styles.statNumber}>{averagePoints}</Text>
            <Text style={styles.statLabel}>Média pts</Text>
          </Card>
        </View>

        {/* Gráfico de Pontuação */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top 5 Pacientes por Pontuação</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" pts"
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(64, 145, 108, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForLabels: {
                fontSize: 12,
              },
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </Card>

        {/* Lista Detalhada */}
        <Card style={styles.listCard}>
          <Text style={styles.listTitle}>Todos os Pacientes</Text>
          {patientScores.map((patient, index) => (
            <View key={patient.id} style={styles.patientItem}>
              <View style={styles.patientLeft}>
                <View style={[
                  styles.rankBadge,
                  index === 0 && styles.rankBadgeGold,
                  index === 1 && styles.rankBadgeSilver,
                  index === 2 && styles.rankBadgeBronze,
                ]}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientStats}>
                    {patient.checkIns} check-ins
                  </Text>
                </View>
              </View>
              <View style={styles.patientRight}>
                <Text style={styles.patientPoints}>{patient.totalPoints}</Text>
                <Text style={styles.patientPointsLabel}>pontos</Text>
              </View>
            </View>
          ))}
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 16,
    padding: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chart: {
    borderRadius: 16,
  },
  listCard: {
    marginBottom: 16,
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  patientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeGold: {
    backgroundColor: '#FFD700',
  },
  rankBadgeSilver: {
    backgroundColor: '#C0C0C0',
  },
  rankBadgeBronze: {
    backgroundColor: '#CD7F32',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  patientStats: {
    fontSize: 14,
    color: '#999',
  },
  patientRight: {
    alignItems: 'flex-end',
  },
  patientPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#40916C',
  },
  patientPointsLabel: {
    fontSize: 12,
    color: '#666',
  },
});

