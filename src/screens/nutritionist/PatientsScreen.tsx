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
import Button from '../../components/Button';

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [associationCode, setAssociationCode] = useState('');

  // Dados mockados para demonstração
  const mockPatients: Patient[] = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      lastCheckIn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      totalCheckIns: 45,
      adherenceRate: 85,
      isActive: true,
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      lastCheckIn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      totalCheckIns: 32,
      adherenceRate: 78,
      isActive: true,
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      lastCheckIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalCheckIns: 28,
      adherenceRate: 65,
      isActive: false,
    },
  ];

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setPatients(mockPatients);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadPatients().finally(() => {
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
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FF9800';
    return '#F44336';
  };

  const generateAssociationCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setAssociationCode(code);
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
            { backgroundColor: patient.isActive ? '#4CAF50' : '#F44336' }
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
          onPress={() => {}}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Remover"
          onPress={() => {}}
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
                <Ionicons name="copy-outline" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title="Gerar Código"
              onPress={generateAssociationCode}
              style={styles.generateButton}
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
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    color: '#4CAF50',
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
