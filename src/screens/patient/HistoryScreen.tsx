import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import MealTypeSelector from '../../components/MealTypeSelector';
import HungerSlider from '../../components/HungerSlider';
import SatietySlider from '../../components/SatietySlider';
import CatSatisfactionSlider from '../../components/CatSatisfactionSlider';
import TagSelector from '../../components/TagSelector';
import PhotoSelector from '../../components/PhotoSelector';
import OfflineMessage from '../../components/OfflineMessage';
import Toast from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { MealCheckIn } from '../../types';
import { mealService } from '../../services/MealService';

// Imagens padrão para refeições sem foto
const DEFAULT_MEAL_IMAGES = [
  require('../../../assets/images/random_pictures/refeicao1.jpg'),
  require('../../../assets/images/random_pictures/refeicao2.jpg'),
];

// Função para selecionar imagem padrão consistente baseada no ID
const getDefaultImage = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_MEAL_IMAGES[hash % DEFAULT_MEAL_IMAGES.length];
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [allCheckIns, setAllCheckIns] = useState<MealCheckIn[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Edit modal states
  const [editing, setEditing] = useState<MealCheckIn | null>(null);
  const [mealType, setMealType] = useState('');
  const [hungerRating, setHungerRating] = useState(3);
  const [satietyRating, setSatietyRating] = useState(3);
  const [satisfactionRating, setSatisfactionRating] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOffline) {
      loadCheckIns();
    }
  }, [isOffline]);

  // Reload check-ins when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!isOffline) {
        loadCheckIns();
      }
    }, [isOffline])
  );

  const loadCheckIns = async () => {
    if (isOffline) {
      return;
    }
    try {
      const data = await mealService.getMyCheckIns();
      setAllCheckIns(data);
    } catch (e) {
      setAllCheckIns([]);
    }
  };

  // Filter check-ins based on selected period
  const filterCheckInsByPeriod = (checkIns: MealCheckIn[], period: 'today' | 'week' | 'month'): MealCheckIn[] => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return checkIns.filter(checkIn => {
      const checkInDate = new Date(checkIn.timestamp);
      
      switch (period) {
        case 'today':
          return checkInDate >= startOfToday;
        
        case 'week':
          const weekAgo = new Date(startOfToday);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return checkInDate >= weekAgo;
        
        case 'month':
          const monthAgo = new Date(startOfToday);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return checkInDate >= monthAgo;
        
        default:
          return true;
      }
    });
  };

  // Get filtered check-ins based on selected period
  const checkIns = filterCheckInsByPeriod(allCheckIns, selectedPeriod);

  const openEdit = (item: MealCheckIn) => {
    if (isOffline) {
      Alert.alert(
        'Sem conexão',
        'Você precisa estar conectado à internet para editar um check-in.'
      );
      return;
    }
    setEditing(item);
    setMealType(item.mealType);
    setHungerRating(item.hungerRating || 3);
    setSatietyRating(item.satietyRating || 3);
    setSatisfactionRating(item.satisfactionRating || 3);
    setTags(item.tag ? item.tag.split(', ').filter(t => t.trim()) : []);
    setPhotoUri(item.photo || null);
    setObservations(item.observations || '');
  };

  const closeEditModal = () => {
    setEditing(null);
    setMealType('');
    setHungerRating(3);
    setSatietyRating(3);
    setSatisfactionRating(3);
    setTags([]);
    setPhotoUri(null);
    setObservations('');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    if (!mealType.trim()) {
      Alert.alert('Erro', 'Selecione o tipo de refeição');
      return;
    }

    setSaving(true);
    try {
      await mealService.updateCheckIn(editing.id, {
        mealType: mealType.trim(),
        hungerRating,
        satietyRating,
        satisfactionRating,
        tag: tags.join(', ') || undefined,
        photo: photoUri || undefined,
        observations: observations.trim() || undefined,
      });
      closeEditModal();
      await loadCheckIns();
      setToastMessage('Check-in atualizado com sucesso!');
      setShowToast(true);
    } catch (error) {
      console.error('Erro ao atualizar check-in:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o check-in');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (item: MealCheckIn) => {
    // Check internet connection before deleting
    if (isOffline) {
      Alert.alert(
        'Sem conexão',
        'Você precisa estar conectado à internet para excluir um check-in.'
      );
      return;
    }

    // First click: expand delete button
    if (deletingId !== item.id) {
      setDeletingId(item.id);
      return;
    }

    // Second click: confirm and delete
    handleConfirmDelete(item.id);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await mealService.deleteCheckIn(id);
      await loadCheckIns();
      setDeletingId(null);
      setToastMessage('Refeição excluída com sucesso!');
      setShowToast(true);
    } catch (e: any) {
      console.error('Erro ao excluir check-in:', e);
      const errorMessage = e?.message || 'Não foi possível excluir.';
      Alert.alert('Erro', errorMessage);
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const onRefresh = React.useCallback(() => {
    if (isOffline) {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    loadCheckIns().finally(() => {
      setRefreshing(false);
    });
  }, [isOffline]);

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

  const renderStars = (rating: number, size: number = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color={i <= rating ? '#FFD700' : '#E0E0E0'}
        />
      );
    }
    return stars;
  };

  const renderCheckIn = (checkIn: MealCheckIn) => {
    const date = new Date(checkIn.timestamp);
    const timeStr = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Usa a foto do usuário ou uma imagem padrão
    const imageSource = checkIn.photo 
      ? { uri: checkIn.photo }
      : getDefaultImage(checkIn.id);

    return (
      <Card key={checkIn.id} style={styles.checkInCard}>
        <View style={styles.cardPhotoContainer}>
          <Image 
            source={imageSource} 
            style={styles.cardPhoto}
            resizeMode="cover"
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardMealType} numberOfLines={1}>{checkIn.mealType}</Text>
            <Text style={styles.cardTime}>{timeStr}</Text>
          </View>

          {checkIn.tag && (
            <View style={styles.cardTagContainer}>
              <Text style={styles.cardTag} numberOfLines={1}>{checkIn.tag}</Text>
            </View>
          )}

          <View style={styles.cardRatings}>
            <View style={styles.cardRatingRow}>
              <Text style={styles.cardRatingLabel}>Fome</Text>
              <View style={styles.cardStars}>
                {renderStars(checkIn.hungerRating, 12)}
              </View>
            </View>
            <View style={styles.cardRatingRow}>
              <Text style={styles.cardRatingLabel}>Saciedade</Text>
              <View style={styles.cardStars}>
                {renderStars(checkIn.satietyRating, 12)}
              </View>
            </View>
            <View style={styles.cardRatingRow}>
              <Text style={styles.cardRatingLabel}>Satisfação</Text>
              <View style={styles.cardStars}>
                {renderStars(checkIn.satisfactionRating, 12)}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          {deletingId === checkIn.id ? (
            <>
              <TouchableOpacity
                onPress={handleCancelDelete}
                style={styles.cardActionButton}
              >
                <Ionicons name="close" size={18} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleConfirmDelete(checkIn.id)}
                style={[styles.cardActionButton, styles.cardDeleteButton]}
              >
                <Ionicons name="trash" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => openEdit(checkIn)}
                style={styles.cardActionButton}
              >
                <Ionicons name="create-outline" size={18} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteClick(checkIn)}
                style={styles.cardActionButton}
              >
                <Ionicons name="trash-outline" size={18} color="#E53935" />
              </TouchableOpacity>
            </>
          )}
        </View>
    </Card>
    );
  };

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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            enabled={!isOffline}
          />
        }
      >
        {isOffline ? (
          <OfflineMessage />
        ) : checkIns.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Nenhum check-in encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Registre sua primeira refeição para começar a acompanhar seu progresso!
            </Text>
          </Card>
        ) : (
          <View style={styles.cardsGrid}>
            {checkIns.map(renderCheckIn)}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeEditModal}
          >
            <TouchableOpacity
              style={styles.modalContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Check-in</Text>
                <TouchableOpacity onPress={closeEditModal} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <MealTypeSelector
                  value={mealType}
                  onValueChange={setMealType}
                  required
                />

                <PhotoSelector
                  photoUri={photoUri}
                  onPhotoChange={setPhotoUri}
                />

                <View style={styles.fieldContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>🍽️ Nível de Fome</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <HungerSlider
                    label=""
                    value={hungerRating}
                    onValueChange={setHungerRating}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>😴 Nível de Saciedade</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <SatietySlider
                    label=""
                    value={satietyRating}
                    onValueChange={setSatietyRating}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>🐱 Satisfação com a Refeição</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <CatSatisfactionSlider
                    label=""
                    value={satisfactionRating}
                    onValueChange={setSatisfactionRating}
                  />
                </View>

                <TagSelector
                  selectedTags={tags}
                  onTagsChange={setTags}
                />

                <Input
                  label="Observações"
                  value={observations}
                  onChangeText={setObservations}
                  placeholder="Comentários sobre a refeição..."
                  multiline
                  numberOfLines={4}
                  style={styles.observationsInput}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={closeEditModal}
                  style={styles.modalButton}
                />
                <Button
                  title="Salvar Alterações"
                  onPress={handleSaveEdit}
                  loading={saving}
                  style={styles.modalButton}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
      
      <Toast
        visible={showToast}
        message={toastMessage}
        type="success"
        onHide={() => setShowToast(false)}
      />
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
    backgroundColor: '#40916C',
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
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  checkInCard: {
    width: '48%',
    marginBottom: 0,
    padding: 0,
    overflow: 'hidden',
  },
  cardPhotoContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F5F5F5',
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardMealType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardTime: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  cardTagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTag: {
    fontSize: 10,
    color: '#40916C',
    fontWeight: '500',
  },
  cardRatings: {
    gap: 6,
  },
  cardRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRatingLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  cardStars: {
    flexDirection: 'row',
    gap: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cardActionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  cardDeleteButton: {
    backgroundColor: '#E53935',
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
    color: '#40916C',
    fontWeight: '500',
  },
  ratingsContainer: {
    marginBottom: 12,
  },
  ratingsWithPhoto: {
    flex: 1,
    justifyContent: 'center',
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
  deleteConfirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  confirmDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E53935',
    flex: 1,
    justifyContent: 'center',
  },
  confirmDeleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  modalScrollContent: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  required: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: 4,
  },
  observationsInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    flex: 1,
  },
});
