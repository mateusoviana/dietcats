import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MealTypeSelector from '../../components/MealTypeSelector';
import HungerSlider from '../../components/HungerSlider';
import SatietySlider from '../../components/SatietySlider';
import CatSatisfactionSlider from '../../components/CatSatisfactionSlider';
import TagSelector from '../../components/TagSelector';
import PhotoSelector from '../../components/PhotoSelector';
import RequiredFieldModal from '../../components/RequiredFieldModal';
import SuccessModal from '../../components/SuccessModal';
import OfflineMessage from '../../components/OfflineMessage';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { PatientTabParamList } from '../../types';
import { mealService } from '../../services/MealService';

type CheckInScreenNavigationProp = BottomTabNavigationProp<PatientTabParamList, 'CheckIn'>;

export default function CheckInScreen() {
  const navigation = useNavigation<CheckInScreenNavigationProp>();
  const { isOffline } = useNetworkStatus();
  const [mealType, setMealType] = useState('');
  const [hungerRating, setHungerRating] = useState(3);
  const [satietyRating, setSatietyRating] = useState(3);
  const [satisfactionRating, setSatisfactionRating] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRequiredModal, setShowRequiredModal] = useState(false);
  const [requiredField, setRequiredField] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const resetForm = () => {
    setMealType('');
    setHungerRating(3);
    setSatietyRating(3);
    setSatisfactionRating(3);
    setTags([]);
    setPhotoUri(null);
    setObservations('');
  };

  const handleRegisterAnother = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  const handleGoHome = () => {
    setShowSuccessModal(false);
    resetForm();
    navigation.navigate('Home');
  };

  const handleSubmit = async () => {
    // Verificar conexão com internet
    if (isOffline) {
      Alert.alert(
        'Sem conexão',
        'Você precisa estar conectado à internet para registrar um check-in.'
      );
      return;
    }

    // Validação de campos obrigatórios
    if (!mealType.trim()) {
      setRequiredField('Tipo de Refeição');
      setShowRequiredModal(true);
      return;
    }

    setLoading(true);
    try {
      await mealService.addCheckIn({
        mealType: mealType.trim(),
        hungerRating,
        satietyRating,
        satisfactionRating,
        tag: tags.join(', ') || undefined,
        photo: photoUri || undefined,
        observations: observations.trim() || undefined,
      });
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Check-in de Refeição</Text>
          <Text style={styles.subtitle}>Registre sua refeição</Text>
        </View>

        {isOffline ? (
          <OfflineMessage />
        ) : (
          <>
            <Card style={styles.formCard}>
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

          <Button
            title="Registrar Check-in"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </Card>

        <RequiredFieldModal
          visible={showRequiredModal}
          fieldName={requiredField}
          onClose={() => setShowRequiredModal(false)}
        />

        <SuccessModal
          visible={showSuccessModal}
          title="Check-in Registrado!"
          message="Sua refeição foi registrada com sucesso."
          onRegisterAnother={handleRegisterAnother}
          onGoHome={handleGoHome}
        />

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dicas para um melhor check-in:</Text>
          <Text style={styles.tipText}>• Seja honesto com suas avaliações</Text>
          <Text style={styles.tipText}>• Use tags para categorizar suas refeições</Text>
          <Text style={styles.tipText}>• Adicione observações sobre como se sentiu</Text>
          <Text style={styles.tipText}>• Registre imediatamente após a refeição</Text>
        </Card>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
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
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: -8,
    marginBottom: 12,
  },
  formCard: {
    margin: 16,
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
  submitButton: {
    marginTop: 24,
  },
  tipsCard: {
    margin: 16,
    marginTop: 0,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#40916C',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
