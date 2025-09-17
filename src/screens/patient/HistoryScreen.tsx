import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { MealCheckIn } from '../../types';
import { mealService } from '../../services/MealService';
import Input from '../../components/Input';
import RatingSelector from '../../components/RatingSelector';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<MealCheckIn[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [editing, setEditing] = useState<MealCheckIn | null>(null);
  const [mealType, setMealType] = useState('');
  const [hungerRating, setHungerRating] = useState(3);
  const [satietyRating, setSatietyRating] = useState(3);
  const [satisfactionRating, setSatisfactionRating] = useState(3);
  const [tag, setTag] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCheckIns();
  }, [selectedPeriod]);

  const loadCheckIns = async () => {
    try {
      const data = await mealService.getMyCheckIns();
      // For now, ignore period filter client-side (could be filtered by date)
      setCheckIns(data);
    } catch (e) {
      setCheckIns([]);
    }
  };

  const openEdit = (item: MealCheckIn) => {
    setEditing(item);
    setMealType(item.mealType);
    setHungerRating(item.hungerRating || 0);
    setSatietyRating(item.satietyRating || 0);
    setSatisfactionRating(item.satisfactionRating || 0);
    setTag(item.tag || '');
    setObservations(item.observations || '');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await mealService.updateCheckIn(editing.id, {
        mealType: mealType.trim(),
        hungerRating,
        satietyRating,
        satisfactionRating,
        tag: tag.trim() || undefined,
        observations: observations.trim() || undefined,
      });
      setEditing(null);
      await loadCheckIns();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: MealCheckIn) => {
    if (Platform.OS === 'web') {
      const ok = (globalThis as any)?.confirm?.('Deseja excluir este check-in?');
      if (!ok) return;
      (async () => {
        try {
          await mealService.deleteCheckIn(item.id);
          await loadCheckIns();
        } catch (e) {
          (globalThis as any)?.alert?.('Erro ao excluir.');
        }
      })();
      return;
    }
    Alert.alert(
      'Excluir check-in',
      'Deseja excluir este check-in?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await mealService.deleteCheckIn(item.id);
              await loadCheckIns();
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
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

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={() => openEdit(checkIn)}
          style={styles.actionIcon}
          accessibilityLabel="Editar check-in"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(checkIn)}
          style={styles.actionIcon}
          accessibilityLabel="Excluir check-in"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color="#E53935" />
        </TouchableOpacity>
      </View>
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
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Editar Check-in</Text>
              <Input label="Tipo de Refeição" value={mealType} onChangeText={setMealType} />
              <RatingSelector label="Fome" value={hungerRating} onValueChange={setHungerRating} />
              <RatingSelector label="Saciedade" value={satietyRating} onValueChange={setSatietyRating} />
              <RatingSelector label="Satisfação" value={satisfactionRating} onValueChange={setSatisfactionRating} />
              <Input label="Tag" value={tag} onChangeText={setTag} />
              <Input label="Observações" value={observations} onChangeText={setObservations} multiline numberOfLines={3} />
              <View style={styles.modalActions}>
                <Button title="Cancelar" variant="outline" onPress={() => setEditing(null)} style={styles.modalBtn} />
                <Button title="Salvar" onPress={handleSaveEdit} loading={saving} style={styles.modalBtn} />
              </View>
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionIcon: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalScroll: {
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalBtn: {
    marginLeft: 8,
  },
});
