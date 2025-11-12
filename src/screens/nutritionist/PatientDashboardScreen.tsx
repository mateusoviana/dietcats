import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import supabase from '../../lib/supabase';

interface PatientDashboardProps {
  route: {
    params: {
      patientId: string;
      patientName: string;
    };
  };
}

interface CheckInData {
  id: string;
  mealType: string;
  timestamp: string;
  hungerRating: number;
  satietyRating: number;
  satisfactionRating: number;
  totalStars: number;
}

export default function PatientDashboardScreen({ route }: PatientDashboardProps) {
  const { patientId, patientName } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [averageStars, setAverageStars] = useState(0);
  const [last7Days, setLast7Days] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, [patientId]);

  const loadDashboard = async () => {
    try {
      console.log('📊 Loading dashboard for patient:', patientId);

      // Buscar todos os check-ins do paciente
      const { data, error } = await supabase
        .from('meal_check_ins')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      console.log('📊 Check-ins loaded:', data?.length);

      // Calcular estatísticas
      const checkInsData: CheckInData[] = (data || []).map((row) => ({
        id: row.id,
        mealType: row.meal_type,
        timestamp: row.timestamp,
        hungerRating: row.hunger_rating || 0,
        satietyRating: row.satiety_rating || 0,
        satisfactionRating: row.satisfaction_rating || 0,
        totalStars:
          (row.hunger_rating || 0) +
          (row.satiety_rating || 0) +
          (row.satisfaction_rating || 0),
      }));

      setCheckIns(checkInsData);
      setTotalCheckIns(checkInsData.length);

      // Total de estrelas
      const total = checkInsData.reduce((sum, item) => sum + item.totalStars, 0);
      setTotalStars(total);

      // Média de estrelas
      const avg = checkInsData.length > 0 ? total / checkInsData.length : 0;
      setAverageStars(Math.round(avg * 10) / 10);

      // Check-ins nos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = checkInsData.filter(
        (item) => new Date(item.timestamp) >= sevenDaysAgo
      );
      setLast7Days(recent.length);
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [patientId]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMealIcon = (mealType: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'Café da Manhã': 'sunny',
      'Almoço': 'restaurant',
      'Jantar': 'moon',
      'Lanche': 'cafe',
    };
    return icons[mealType] || 'fast-food';
  };

  const renderStars = (count: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.round(count / 3) ? 'star' : 'star-outline'}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{patientName}</Text>
        <Text style={styles.subtitle}>Dashboard do Paciente</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Cards de Estatísticas */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons name="restaurant" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{totalCheckIns}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="star" size={32} color="#FFD700" />
            <Text style={styles.statNumber}>{totalStars}</Text>
            <Text style={styles.statLabel}>Estrelas</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="trending-up" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{averageStars.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Média</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="calendar" size={32} color="#FF9800" />
            <Text style={styles.statNumber}>{last7Days}</Text>
            <Text style={styles.statLabel}>7 dias</Text>
          </Card>
        </View>

        {/* Histórico de Check-ins */}
        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>Histórico de Check-ins</Text>

          {checkIns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>Nenhum check-in registrado</Text>
            </View>
          ) : (
            checkIns.slice(0, 20).map((checkIn) => (
              <View key={checkIn.id} style={styles.checkInItem}>
                <View style={styles.checkInIcon}>
                  <Ionicons
                    name={getMealIcon(checkIn.mealType)}
                    size={24}
                    color="#4CAF50"
                  />
                </View>
                <View style={styles.checkInInfo}>
                  <Text style={styles.checkInMeal}>{checkIn.mealType}</Text>
                  <Text style={styles.checkInDate}>{formatDate(checkIn.timestamp)}</Text>
                </View>
                <View style={styles.checkInRatings}>
                  {renderStars(checkIn.totalStars)}
                  <Text style={styles.checkInStarsTotal}>{checkIn.totalStars} ⭐</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {checkIns.length > 20 && (
          <Text style={styles.moreText}>
            Mostrando 20 de {checkIns.length} check-ins
          </Text>
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
    backgroundColor: '#4CAF50',
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (Dimensions.get('window').width - 48) / 2,
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  historyCard: {
    margin: 16,
    marginTop: 0,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  checkInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  checkInIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkInInfo: {
    flex: 1,
  },
  checkInMeal: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  checkInDate: {
    fontSize: 12,
    color: '#666',
  },
  checkInRatings: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  checkInStarsTotal: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  moreText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    paddingVertical: 16,
  },
});

