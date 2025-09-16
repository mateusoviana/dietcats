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
import RatingSelector from '../../components/RatingSelector';

export default function CheckInScreen() {
  const [mealType, setMealType] = useState('');
  const [hungerRating, setHungerRating] = useState(3);
  const [satietyRating, setSatietyRating] = useState(3);
  const [satisfactionRating, setSatisfactionRating] = useState(3);
  const [tag, setTag] = useState('');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const mealTypes = [
    'Café da Manhã',
    'Lanche da Manhã',
    'Almoço',
    'Lanche da Tarde',
    'Jantar',
    'Ceia',
  ];

  const handleSubmit = async () => {
    if (!mealType.trim()) {
      Alert.alert('Erro', 'Selecione o tipo de refeição');
      return;
    }

    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Sucesso!',
        'Check-in registrado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setMealType('');
              setHungerRating(3);
              setSatietyRating(3);
              setSatisfactionRating(3);
              setTag('');
              setObservations('');
            },
          },
        ]
      );
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
          <Input
            label="Tipo de Refeição"
            value={mealType}
            onChangeText={setMealType}
            placeholder="Ex: Café da Manhã, Almoço..."
            error={!mealType.trim() ? 'Campo obrigatório' : undefined}
          />

          <RatingSelector
            label="Nível de Fome (1 = com muita fome, 5 = sem fome)"
            value={hungerRating}
            onValueChange={setHungerRating}
          />

          <RatingSelector
            label="Nível de Saciedade (1 = ainda com fome, 5 = muito satisfeito)"
            value={satietyRating}
            onValueChange={setSatietyRating}
          />

          <RatingSelector
            label="Satisfação com a Refeição (1 = muito insatisfeito, 5 = muito satisfeito)"
            value={satisfactionRating}
            onValueChange={setSatisfactionRating}
          />

          <Input
            label="Tag (opcional)"
            value={tag}
            onChangeText={setTag}
            placeholder="Ex: saudável, cheat meal, vegetariano..."
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
    color: '#4CAF50',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
