import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { associationService } from '../../services/AssociationService';
import supabase from '../../lib/supabase';

interface Patient {
  id: string;
  name: string;
  email: string;
  lastCheckIn?: string;
  totalCheckIns: number;
  adherenceRate: number;
  isActive: boolean;
}

export default function PatientsScreen() {
  const navigation = useNavigation<any>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [associationCode, setAssociationCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadCode(), loadPatients()]);
  };

  const loadCode = async () => {
    try {
      const code = await associationService.getMyCode();
      if (code) {
        setAssociationCode(code);
      }
    } catch (error) {
      console.error('Error loading code:', error);
    }
  };

  const loadPatients = async () => {
    try {
      console.log('🔄 [PatientsScreen] Loading patients...');
      const data = await associationService.getMyPatients();
      console.log('🔄 [PatientsScreen] Patients loaded:', data.length);

      // Buscar check-ins de cada paciente para calcular estatísticas
      const patientsWithStats = await Promise.all(
        data.map(async (p) => {
          try {
            // Buscar check-ins do paciente
            const { data: checkIns, error } = await supabase
              .from('meal_check_ins')
              .select('timestamp')
              .eq('patient_id', p.id);

            if (error) throw error;

            const totalCheckIns = checkIns?.length || 0;
            
            // Calcular último check-in
            let lastCheckIn: string | undefined;
            if (checkIns && checkIns.length > 0) {
              const sorted = checkIns.sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
              lastCheckIn = sorted[0].timestamp;
            }

            // Calcular taxa de adesão (check-ins nos últimos 7 dias)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentCheckIns = checkIns?.filter(
              (ci) => new Date(ci.timestamp) >= sevenDaysAgo
            ).length || 0;
            
            // Taxa de adesão: (check-ins na semana / 21 esperados) * 100
            // 21 = 3 refeições/dia * 7 dias
            const adherenceRate = Math.min(100, Math.round((recentCheckIns / 21) * 100));
            
            // Consideramos ativo se teve check-in nos últimos 3 dias
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const isActive = lastCheckIn ? new Date(lastCheckIn) >= threeDaysAgo : false;

            return {
              id: p.id,
              name: p.name,
              email: p.email,
              lastCheckIn,
              totalCheckIns,
              adherenceRate,
              isActive,
            };
          } catch (error) {
            console.error(`❌ Error loading stats for patient ${p.id}:`, error);
            return {
              id: p.id,
              name: p.name,
              email: p.email,
              totalCheckIns: 0,
              adherenceRate: 0,
              isActive: false,
            };
          }
        })
      );

      console.log('✅ [PatientsScreen] Patients with stats loaded');
      setPatients(patientsWithStats);
    } catch (error) {
      console.error('❌ [PatientsScreen] Error loading patients:', error);
      setPatients([]);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const formatLastCheckIn = (timestamp?: string) => {
    if (!timestamp) return 'Nunca';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dias atrás`;
    }
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return '#40916C';
    if (rate >= 60) return '#FF9800';
    return '#F44336';
  };

  const generateAssociationCode = async () => {
    setIsGeneratingCode(true);
    try {
      const code = await associationService.generateCode();
      setAssociationCode(code);
      Alert.alert('Código Gerado', `Seu código é: ${code}\n\nCompartilhe com seus pacientes!`);
    } catch (error) {
      console.error('Error generating code:', error);
      Alert.alert('Erro', 'Não foi possível gerar o código');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const renderPatient = (patient: Patient) => (
    <Card key={patient.id} style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientEmail}>{patient.email}</Text>
        </View>
        <View style={styles.patientStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: patient.isActive ? '#40916C' : '#F44336' }
          ]} />
          <Text style={styles.statusText}>
            {patient.isActive ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>

      <View style={styles.patientStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{patient.totalCheckIns}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: getAdherenceColor(patient.adherenceRate) }]}>
            {patient.adherenceRate}%
          </Text>
          <Text style={styles.statLabel}>Adesão</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {formatLastCheckIn(patient.lastCheckIn)}
          </Text>
          <Text style={styles.statLabel}>Último</Text>
        </View>
      </View>

      <View style={styles.patientActions}>
        <Button
          title="Ver Dashboard"
          onPress={() => {
            navigation.navigate('PatientDashboard', {
              patientId: patient.id,
              patientName: patient.name,
            });
          }}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Remover"
          onPress={() => {
            Alert.alert(
              'Remover Paciente',
              `Deseja remover ${patient.name} da sua lista?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Remover',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Remover associação
                      const { error } = await supabase
                        .from('profiles')
                        .update({ nutritionist_id: null })
                        .eq('id', patient.id);

                      if (error) throw error;

                      Alert.alert('Sucesso', 'Paciente removido');
                      loadData();
                    } catch (error) {
                      Alert.alert('Erro', 'Não foi possível remover o paciente');
                    }
                  },
                },
              ]
            );
          }}
          variant="outline"
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Pacientes</Text>
        <Text style={styles.subtitle}>Gerencie seus pacientes</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.associationCard}>
          <Text style={styles.cardTitle}>Código de Associação</Text>
          <Text style={styles.cardSubtitle}>
            Compartilhe este código com seus pacientes para que eles possam se associar à sua conta
          </Text>
          
          {associationCode ? (
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{associationCode}</Text>
              <TouchableOpacity style={styles.copyButton}>
                <Ionicons name="copy-outline" size={20} color="#40916C" />
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title={isGeneratingCode ? "Gerando..." : "Gerar Código"}
              onPress={generateAssociationCode}
              style={styles.generateButton}
              disabled={isGeneratingCode}
            />
          )}
        </Card>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statCardNumber}>{patients.length}</Text>
            <Text style={styles.statCardLabel}>Total de Pacientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardNumber}>
              {patients.filter(p => p.isActive).length}
            </Text>
            <Text style={styles.statCardLabel}>Pacientes Ativos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardNumber}>
              {Math.round(patients.reduce((sum, p) => sum + p.adherenceRate, 0) / patients.length) || 0}%
            </Text>
            <Text style={styles.statCardLabel}>Adesão Média</Text>
          </View>
        </View>

        {patients.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Nenhum paciente encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Compartilhe seu código de associação para começar a acompanhar pacientes.
            </Text>
          </Card>
        ) : (
          patients.map(renderPatient)
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  associationCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D8F3DC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#40916C',
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#40916C',
    marginRight: 12,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  generateButton: {
    minWidth: 150,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#40916C',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  patientCard: {
    marginBottom: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
  },
  patientStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  patientStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  patientActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  removeButton: {
    borderColor: '#F44336',
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
