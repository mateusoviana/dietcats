import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface MealSchedule {
  id: string;
  mealType: string;
  time: Date;
  notificationId?: string;
  enabled: boolean;
}

// Configurar como as notificações serão exibidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private STORAGE_KEY = 'mealSchedules';

  // Solicitar permissões de notificação
  async requestPermissions(): Promise<boolean> {
    try {
      // Na web, retorna true mas não configura notificações
      if (Platform.OS === 'web') {
        console.warn('Notificações push não são totalmente suportadas na web');
        return true;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permissão de notificação negada');
        return false;
      }

      // Configurar canal de notificação para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meal-reminders', {
          name: 'Lembretes de Refeição',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }

  // Agendar notificação de refeição
  async scheduleMealNotification(mealType: string, time: Date): Promise<string | null> {
    try {
      // Notificações agendadas não funcionam na web
      if (Platform.OS === 'web') {
        console.warn('Notificações agendadas não são suportadas na web');
        return 'web-mock-id'; // Retorna ID falso para web
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permissão de notificação não concedida');
      }

      // Criar trigger para notificação diária no horário especificado
      const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Hora da Refeição!`,
          body: `Está na hora do seu ${mealType}. Não esqueça de fazer o check-in!`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { mealType, scheduledTime: time.toISOString() },
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      return null;
    }
  }

  // Cancelar notificação
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      // Na web, não há notificações para cancelar
      if (Platform.OS === 'web' || notificationId === 'web-mock-id') {
        return;
      }
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Erro ao cancelar notificação:', error);
    }
  }

  // Salvar agendamento
  async saveMealSchedule(mealType: string, time: Date): Promise<MealSchedule> {
    try {
      const schedules = await this.getMealSchedules();
      
      // Verificar se já existe um agendamento para este tipo de refeição
      const existingSchedule = schedules.find(s => s.mealType === mealType);
      
      if (existingSchedule && existingSchedule.notificationId) {
        // Cancelar notificação anterior
        await this.cancelNotification(existingSchedule.notificationId);
      }

      // Agendar nova notificação
      const notificationId = await this.scheduleMealNotification(mealType, time);

      const newSchedule: MealSchedule = {
        id: existingSchedule?.id || Date.now().toString(),
        mealType,
        time,
        notificationId: notificationId || undefined,
        enabled: true,
      };

      // Remover agendamento antigo se existir
      const updatedSchedules = schedules.filter(s => s.mealType !== mealType);
      updatedSchedules.push(newSchedule);

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSchedules));
      
      return newSchedule;
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      throw error;
    }
  }

  // Obter todos os agendamentos
  async getMealSchedules(): Promise<MealSchedule[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const schedules = JSON.parse(data);
      // Converter strings de data de volta para objetos Date
      return schedules.map((schedule: any) => ({
        ...schedule,
        time: new Date(schedule.time),
      }));
    } catch (error) {
      console.error('Erro ao obter agendamentos:', error);
      return [];
    }
  }

  // Remover agendamento
  async removeMealSchedule(scheduleId: string): Promise<void> {
    try {
      const schedules = await this.getMealSchedules();
      const schedule = schedules.find(s => s.id === scheduleId);
      
      if (schedule?.notificationId) {
        await this.cancelNotification(schedule.notificationId);
      }

      const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSchedules));
    } catch (error) {
      console.error('Erro ao remover agendamento:', error);
      throw error;
    }
  }

  // Ativar/desativar agendamento
  async toggleMealSchedule(scheduleId: string, enabled: boolean): Promise<void> {
    try {
      const schedules = await this.getMealSchedules();
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
      
      if (scheduleIndex === -1) return;

      const schedule = schedules[scheduleIndex];

      // Na web, apenas marca como enabled/disabled, mas não agenda notificações
      if (Platform.OS !== 'web') {
        if (enabled && !schedule.notificationId) {
          // Reativar notificação
          const notificationId = await this.scheduleMealNotification(schedule.mealType, schedule.time);
          schedule.notificationId = notificationId || undefined;
        } else if (!enabled && schedule.notificationId) {
          // Desativar notificação
          await this.cancelNotification(schedule.notificationId);
          schedule.notificationId = undefined;
        }
      }

      schedule.enabled = enabled;
      schedules[scheduleIndex] = schedule;

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('Erro ao alternar agendamento:', error);
      throw error;
    }
  }

  // Obter todas as notificações agendadas (para debug)
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      if (Platform.OS === 'web') {
        return [];
      }
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao obter notificações agendadas:', error);
      return [];
    }
  }

  // Cancelar todas as notificações
  async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        return;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao cancelar todas as notificações:', error);
    }
  }
}

export const notificationService = new NotificationService();

