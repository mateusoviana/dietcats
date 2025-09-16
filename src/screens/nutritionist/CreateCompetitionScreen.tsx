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

export default function CreateCompetitionScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Dados mockados de pacientes
  const patients = [
    { id: '1', name: 'João Silva' },
    { id: '2', name: 'Maria Santos' },
    { id: '3', name: 'Pedro Costa' },
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome da competição é obrigatório';
    }

    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!startDate.trim()) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    if (!endDate.trim()) {
      newErrors.endDate = 'Data de fim é obrigatória';
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início';
    }

    if (selectedPatients.length === 0) {
      newErrors.patients = 'Selecione pelo menos um paciente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCompetition = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simular criação da competição
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Sucesso!',
        'Competição criada com sucesso!',
        [{ text: 'OK', onPress: () => {
          // Reset form
          setName('');
          setDescription('');
          setStartDate('');
          setEndDate('');
          setSelectedPatients([]);
        }}]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a competição');
    } finally {
      setLoading(false);
    }
  };

  const togglePatient = (patientId: string) => {
    setSelectedPatients(prev => 
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinEndDate = () => {
    return startDate || getTodayDate();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar Competição</Text>
          <Text style={styles.subtitle}>Configure uma nova competição</Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="Nome da Competição"
            value={name}
            onChangeText={setName}
            placeholder="Ex: Desafio da Semana Saudável"
            error={errors.name}
          />

          <Input
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva os objetivos e regras da competição..."
            multiline
            numberOfLines={4}
            style={styles.descriptionInput}
            error={errors.description}
          />

          <View style={styles.dateContainer}>
            <Input
              label="Data de Início"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              style={styles.dateInput}
              error={errors.startDate}
            />
            <Input
              label="Data de Fim"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              style={styles.dateInput}
              error={errors.endDate}
            />
          </View>

          <View style={styles.patientsSection}>
            <Text style={styles.patientsLabel}>Pacientes Participantes</Text>
            {errors.patients && (
              <Text style={styles.errorText}>{errors.patients}</Text>
            )}
            
            <View style={styles.patientsList}>
              {patients.map(patient => (
                <Button
                  key={patient.id}
                  title={patient.name}
                  onPress={() => togglePatient(patient.id)}
                  variant={selectedPatients.includes(patient.id) ? 'primary' : 'outline'}
                  style={styles.patientButton}
                />
              ))}
            </View>
          </View>

          <View style={styles.scoringSection}>
            <Text style={styles.scoringTitle}>Critérios de Pontuação</Text>
            <Text style={styles.scoringDescription}>
              Os pontos serão distribuídos automaticamente baseados nos check-ins dos pacientes.
            </Text>
            
            <View style={styles.scoringItem}>
              <Text style={styles.scoringLabel}>Check-in de Refeição:</Text>
              <Text style={styles.scoringValue}>10 pontos</Text>
            </View>
            <View style={styles.scoringItem}>
              <Text style={styles.scoringLabel}>Consistência (7 dias seguidos):</Text>
              <Text style={styles.scoringValue}>+5 pontos bônus</Text>
            </View>
            <View style={styles.scoringItem}>
              <Text style={styles.scoringLabel}>Avaliações altas (4-5 estrelas):</Text>
              <Text style={styles.scoringValue}>+2 pontos bônus</Text>
            </View>
          </View>

          <Button
            title="Criar Competição"
            onPress={handleCreateCompetition}
            loading={loading}
            style={styles.createButton}
          />
        </Card>

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dicas para uma boa competição:</Text>
          <Text style={styles.tipText}>• Defina um período realista (1-4 semanas)</Text>
          <Text style={styles.tipText}>• Inclua pacientes com níveis similares de engajamento</Text>
          <Text style={styles.tipText}>• Use descrições claras e motivadoras</Text>
          <Text style={styles.tipText}>• Monitore o progresso regularmente</Text>
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
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  patientsSection: {
    marginVertical: 16,
  },
  patientsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 8,
  },
  patientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  patientButton: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  scoringSection: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  scoringTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  scoringDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  scoringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoringLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  scoringValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  createButton: {
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
