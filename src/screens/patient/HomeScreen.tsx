import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../contexts/AuthContext';
import { PatientTabParamList } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { mealService } from '../../services/MealService';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [checkInCount, setCheckInCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const checkIns = await mealService.getMyCheckIns();
      setCheckInCount(checkIns.length);
      
      // Calcular pontos totais: soma de todas as estrelas (ratings)
      const total = checkIns.reduce((sum, checkIn) => {
        const checkInPoints = 
          (checkIn.hungerRating || 0) + 
          (checkIn.satietyRating || 0) + 
          (checkIn.satisfactionRating || 0);
        return sum + checkInPoints;
      }, 0);
      
      setTotalPoints(total);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setTotalPoints(0);
      setCheckInCount(0);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {getGreeting()}, {user?.name}!
        </Text>
        <Text style={styles.subtitle}>Como está sua dieta hoje?</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Bem-vindo ao DietCats!</Text>
          <Text style={styles.welcomeText}>
            Registre suas refeições, acompanhe seu progresso e participe de competições para manter sua dieta em dia.
          </Text>
          <Button
            title="Fazer Check-in"
            onPress={() => navigation.navigate('CheckIn')}
            style={styles.checkInButton}
          />
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Hoje</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{checkInCount}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.competitionsCard}>
          <Text style={styles.competitionsTitle}>Competições Ativas</Text>
          <Text style={styles.competitionsEmpty}>
            Nenhuma competição ativa no momento
          </Text>
          <Button
            title="Ver Competições"
            onPress={() => navigation.navigate('Competitions')}
            variant="outline"
            style={styles.competitionsButton}
          />
        </Card>

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dica do Dia</Text>
          <Text style={styles.tipsText}>
            Beba pelo menos 2 litros de água por dia para manter seu corpo hidratado e ajudar na digestão.
          </Text>
        </Card>
      </View>
    </ScrollView>
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
    backgroundColor: '#40916C', // primary.500
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#D8F3DC', // primary.50
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#40916C', // primary.500
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  checkInButton: {
    minWidth: 200,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#52B788', // primary.400
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  competitionsCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  competitionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  competitionsEmpty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  competitionsButton: {
    minWidth: 150,
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
