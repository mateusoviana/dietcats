import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { mealService } from '../../services/MealService';
import { notificationService, MealSchedule } from '../../services/NotificationService';
import { PatientTabParamList } from '../../types';

type HomeScreenNavigationProp = BottomTabNavigationProp<PatientTabParamList, 'Home'>;

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [checkInCount, setCheckInCount] = useState(0);
  
  // Estados do modal de agendamento
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mealSchedules, setMealSchedules] = useState<MealSchedule[]>([]);

  useEffect(() => {
    loadStats();
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const schedules = await notificationService.getMealSchedules();
      setMealSchedules(schedules);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    }
  };

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

  const handleSaveSchedule = async () => {
    if (!selectedMealType) {
      alert('Por favor, selecione o tipo de refeição');
      return;
    }

    try {
      await notificationService.saveMealSchedule(selectedMealType, selectedTime);
      
      if (Platform.OS === 'web') {
        alert(`⚠️ Agendamento salvo!\n\nNota: Notificações na web têm limitações. Para melhor experiência com lembretes, use o app mobile (Android/iOS).\n\nHorário configurado: ${selectedTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${selectedMealType}`);
      } else {
        alert(`Agendamento salvo! Você receberá uma notificação todos os dias às ${selectedTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} para ${selectedMealType}.`);
      }
      
      setScheduleModalVisible(false);
      setSelectedMealType('');
      loadSchedules(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      alert('Erro ao salvar agendamento. Por favor, tente novamente.');
    }
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    try {
      await notificationService.removeMealSchedule(scheduleId);
      loadSchedules();
    } catch (error) {
      console.error('Erro ao remover agendamento:', error);
      alert('Erro ao remover agendamento.');
    }
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
          <View style={styles.buttonsContainer}>
            <Button
              title="Fazer Check-in"
              onPress={() => navigation.navigate('CheckIn')}
              style={styles.checkInButton}
            />
            <Button
              title="Agendar Refeição"
              onPress={() => setScheduleModalVisible(true)}
              variant="outline"
              style={styles.scheduleButton}
            />
          </View>
        </Card>

        {/* Card de Agendamentos */}
        {mealSchedules.length > 0 && (
          <Card style={styles.schedulesCard}>
            <Text style={styles.schedulesTitle}>🔔 Meus Agendamentos</Text>
            
            {Platform.OS === 'web' && (
              <View style={styles.webWarning}>
                <Text style={styles.webWarningText}>
                  ⚠️ Você está na versão web. As notificações funcionam apenas no app mobile (Android/iOS).
                </Text>
              </View>
            )}
            
            {mealSchedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleMealType}>{schedule.mealType}</Text>
                  <Text style={styles.scheduleTime}>
                    {schedule.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveSchedule(schedule.id)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}

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

      {/* Modal de Agendamento de Refeição */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={scheduleModalVisible}
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agendar Refeição</Text>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Tipo de Refeição</Text>
              <View style={styles.mealTypeContainer}>
                {['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia'].map((mealType) => (
                  <TouchableOpacity
                    key={mealType}
                    style={[
                      styles.mealTypeButton,
                      selectedMealType === mealType && styles.mealTypeButtonSelected
                    ]}
                    onPress={() => setSelectedMealType(mealType)}
                  >
                    <Text style={[
                      styles.mealTypeText,
                      selectedMealType === mealType && styles.mealTypeTextSelected
                    ]}>
                      {mealType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Horário</Text>
              
              {/* Seletor de Horário para WEB */}
              {Platform.OS === 'web' ? (
                <View style={styles.webTimePickerContainer}>
                  <View style={styles.webTimePickerRow}>
                    {/* Horas */}
                    <View style={styles.webTimeColumn}>
                      <TouchableOpacity
                        style={styles.webTimeButton}
                        onPress={() => {
                          const newTime = new Date(selectedTime);
                          newTime.setHours((newTime.getHours() + 1) % 24);
                          setSelectedTime(newTime);
                        }}
                      >
                        <Text style={styles.webTimeButtonText}>▲</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.webTimeDisplay}>
                        <Text style={styles.webTimeDisplayText}>
                          {selectedTime.getHours().toString().padStart(2, '0')}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.webTimeButton}
                        onPress={() => {
                          const newTime = new Date(selectedTime);
                          newTime.setHours((newTime.getHours() - 1 + 24) % 24);
                          setSelectedTime(newTime);
                        }}
                      >
                        <Text style={styles.webTimeButtonText}>▼</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.webTimeSeparator}>:</Text>

                    {/* Minutos */}
                    <View style={styles.webTimeColumn}>
                      <TouchableOpacity
                        style={styles.webTimeButton}
                        onPress={() => {
                          const newTime = new Date(selectedTime);
                          newTime.setMinutes((newTime.getMinutes() + 1) % 60);
                          setSelectedTime(newTime);
                        }}
                      >
                        <Text style={styles.webTimeButtonText}>▲</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.webTimeDisplay}>
                        <Text style={styles.webTimeDisplayText}>
                          {selectedTime.getMinutes().toString().padStart(2, '0')}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.webTimeButton}
                        onPress={() => {
                          const newTime = new Date(selectedTime);
                          newTime.setMinutes((newTime.getMinutes() - 1 + 60) % 60);
                          setSelectedTime(newTime);
                        }}
                      >
                        <Text style={styles.webTimeButtonText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.timePickerText}>
                      {selectedTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>

                  {showTimePicker && Platform.OS === 'ios' && (
                    <View style={styles.iosTimePickerContainer}>
                      <DateTimePicker
                        value={selectedTime}
                        mode="time"
                        is24Hour={true}
                        display="spinner"
                        onChange={(event: any, date?: Date) => {
                          if (date) setSelectedTime(date);
                        }}
                        style={styles.iosTimePicker}
                      />
                      <Button
                        title="Confirmar Horário"
                        onPress={() => setShowTimePicker(false)}
                        style={styles.confirmTimeButton}
                      />
                    </View>
                  )}

                  {showTimePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event: any, date?: Date) => {
                        setShowTimePicker(false);
                        if (event.type === 'set' && date) {
                          setSelectedTime(date);
                        }
                      }}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setScheduleModalVisible(false);
                  setSelectedMealType('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Salvar"
                onPress={handleSaveSchedule}
                style={styles.modalButton}
                disabled={!selectedMealType}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  checkInButton: {
    paddingHorizontal: 16,
  },
  scheduleButton: {
    paddingHorizontal: 16,
  },
  schedulesCard: {
    marginBottom: 16,
  },
  schedulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  webWarning: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    marginBottom: 16,
  },
  webWarningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleMealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#40916C',
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  mealTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#40916C',
    backgroundColor: '#FFFFFF',
  },
  mealTypeButtonSelected: {
    backgroundColor: '#40916C',
  },
  mealTypeText: {
    fontSize: 14,
    color: '#40916C',
  },
  mealTypeTextSelected: {
    color: '#FFFFFF',
  },
  webTimePickerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  webTimePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTimeColumn: {
    alignItems: 'center',
  },
  webTimeButton: {
    width: 60,
    height: 40,
    backgroundColor: '#40916C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  webTimeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  webTimeDisplay: {
    width: 80,
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#40916C',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  webTimeDisplayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  webTimeSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
  },
  timePickerButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timePickerText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  iosTimePickerContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  iosTimePicker: {
    height: 150,
    width: '100%',
  },
  confirmTimeButton: {
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
  },
});
