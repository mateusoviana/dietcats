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
import { useAuth } from '../../contexts/AuthContext';

interface MealCheckIn {
  id: string;
  mealType: string;
  timestamp: string;
  hungerRating: number;
  satietyRating: number;
  satisfactionRating: number;
  tag?: string;
  observations?: string;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<MealCheckIn[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Dados mockados para demonstração
  const mockCheckIns: MealCheckIn[] = [
    {
      id: '1',
      mealType: 'Café da Manhã',
      timestamp: new Date().toISOString(),
      hungerRating: 4,
      satietyRating: 4,
      satisfactionRating: 5,
      tag: 'saudável',
      observations: 'Aveia com frutas e leite',
    },
    {
      id: '2',
      mealType: 'Almoço',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      hungerRating: 2,
      satietyRating: 5,
      satisfactionRating: 4,
      tag: 'vegetariano',
      observations: 'Salada completa com quinoa',
    },
  ];

  useEffect(() => {
    loadCheckIns();
  }, [selectedPeriod]);

  const loadCheckIns = async () => {
    setCheckIns(mockCheckIns);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCheckIns().finally(() => {
      setRefreshing(false);
    });
  }, [selectedPeriod]);

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'Hoje';
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
      default:
        return 'Hoje';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#FFD700' : '#E0E0E0'}
        />
      );
    }
    return stars;
  };

  const renderCheckIn = (checkIn: MealCheckIn) => (
    <Card key={checkIn.id} style={styles.checkInCard}>
      <View style={styles.checkInHeader}>
        <Text style={styles.mealType}>{checkIn.mealType}</Text>
        <Text style={styles.timestamp}>{formatDate(checkIn.timestamp)}</Text>
      </View>

      {checkIn.tag && (
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>{checkIn.tag}</Text>
        </View>
      )}

      <View style={styles.ratingsContainer}>
        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Fome:</Text>
          <View style={styles.starsContainer}>
            {renderStars(checkIn.hungerRating)}
          </View>
        </View>

        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Saciedade:</Text>
          <View style={styles.starsContainer}>
            {renderStars(checkIn.satietyRating)}
          </View>
        </View>

        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Satisfação:</Text>
          <View style={styles.starsContainer}>
            {renderStars(checkIn.satisfactionRating)}
          </View>
        </View>
      </View>

      {checkIn.observations && (
        <View style={styles.observationsContainer}>
          <Text style={styles.observationsLabel}>Observações:</Text>
          <Text style={styles.observationsText}>{checkIn.observations}</Text>
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Refeições</Text>
        <Text style={styles.subtitle}>Acompanhe seu progresso</Text>
      </View>

      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.selectedPeriodButton,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.selectedPeriodButtonText,
              ]}
            >
              {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {checkIns.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Nenhum check-in encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Registre sua primeira refeição para começar a acompanhar seu progresso!
            </Text>
          </Card>
        ) : (
          checkIns.map(renderCheckIn)
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  checkInCard: {
    marginBottom: 16,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  tagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  tag: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  ratingsContainer: {
    marginBottom: 12,
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  observationsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  observationsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  observationsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  },
});
