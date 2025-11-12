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
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MealTypeSelector from '../../components/MealTypeSelector';
import HungerSlider from '../../components/HungerSlider';
import CatSatisfactionSlider from '../../components/CatSatisfactionSlider';
import TagSelector from '../../components/TagSelector';
import PhotoSelector from '../../components/PhotoSelector';
import { mealService } from '../../services/MealService';

export default function CheckInScreen() {
  const [mealType, setMealType] = useState('');
  const [hungerRating, setHungerRating] = useState(3);
  const [satisfactionRating, setSatisfactionRating] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!mealType.trim()) {
      Alert.alert('Erro', 'Selecione o tipo de refeição');
      return;
    }

    setLoading(true);
    try {
      await mealService.addCheckIn({
        mealType: mealType.trim(),
        hungerRating,
        satisfactionRating,
        tag: tags.join(', ') || undefined,
        photo: photoUri || undefined,
        observations: observations.trim() || undefined,
      });
      Alert.alert('Sucesso!', 'Check-in registrado com sucesso!');
      // Reset form
      setMealType('');
      setHungerRating(3);
      setSatisfactionRating(3);
      setTags([]);
      setPhotoUri(null);
      setObservations('');
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

        <Card style={styles.formCard}>
          <MealTypeSelector
            value={mealType}
            onValueChange={setMealType}
          />
          {!mealType.trim() && (
            <Text style={styles.errorText}>Por favor, selecione o tipo de refeição</Text>
          )}

          <PhotoSelector
            photoUri={photoUri}
            onPhotoChange={setPhotoUri}
          />

          <HungerSlider
            label="🍽️ Nível de Fome"
            value={hungerRating}
            onValueChange={setHungerRating}
          />

          <CatSatisfactionSlider
            label="🐱 Satisfação com a Refeição"
            value={satisfactionRating}
            onValueChange={setSatisfactionRating}
          />

          <TagSelector
            selectedTags={tags}
            onTagsChange={setTags}
          />

          <Input
            label="Observações (opcional)"
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

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dicas para um melhor check-in:</Text>
          <Text style={styles.tipText}>• Seja honesto com suas avaliações</Text>
          <Text style={styles.tipText}>• Use tags para categorizar suas refeições</Text>
          <Text style={styles.tipText}>• Adicione observações sobre como se sentiu</Text>
          <Text style={styles.tipText}>• Registre imediatamente após a refeição</Text>
        </Card>
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
