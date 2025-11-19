import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { competitionService } from '../../services/CompetitionService';
import { Competition } from '../../types';
import { NutritionistCompetitionsStackParamList } from '../../navigation/NutritionistCompetitionsStackNavigator';

type EditCompetitionRouteProp = RouteProp<NutritionistCompetitionsStackParamList, 'EditCompetition'>;

export default function EditCompetitionScreen() {
  const route = useRoute<EditCompetitionRouteProp>();
  const navigation = useNavigation();
  const { competitionId } = route.params;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompetition();
  }, [competitionId]);

  const loadCompetition = async () => {
    try {
      setLoading(true);
      const comp = await competitionService.getCompetitionWithScores(competitionId);
      
      if (!comp) {
        Alert.alert('Erro', 'Competição não encontrada');
        navigation.goBack();
        return;
      }
      
      setCompetition(comp);
      setName(comp.name);
      setDescription(comp.description || '');
    } catch (error) {
      console.error('❌ Error loading competition:', error);
      Alert.alert('Erro', 'Não foi possível carregar a competição');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome da competição é obrigatório');
      return;
    }

    try {
      setSaving(true);
      await competitionService.updateCompetition(competitionId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      
      Alert.alert('Sucesso', 'Competição atualizada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('❌ Error updating competition:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a competição');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#40916C" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!competition) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Competição não encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Editar Competição</Text>
          <Text style={styles.subtitle}>Atualize as informações</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nome da Competição *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Desafio de Novembro"
              placeholderTextColor="#999"
              maxLength={100}
            />
            <Text style={styles.charCount}>{name.length}/100</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva os objetivos e regras da competição..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Apenas o nome e a descrição podem ser editados. Datas, participantes e critérios de pontuação não podem ser alterados após a criação.
            </Text>
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
            disabled={saving}
          />
          <Button
            title={saving ? 'Salvando...' : 'Salvar Alterações'}
            onPress={handleSave}
            style={styles.saveButton}
            disabled={saving}
          />
        </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#40916C',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
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
  formCard: {
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});

