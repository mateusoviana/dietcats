import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient, Nutritionist, MealCheckIn, Competition } from '../types';

class StorageService {
  // User Data
  async saveUser(user: Patient | Nutritionist): Promise<void> {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async getUser(): Promise<Patient | Nutritionist | null> {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing user:', error);
    }
  }

  // Meal Check-ins
  async saveMealCheckIn(checkIn: MealCheckIn): Promise<void> {
    try {
      const existingCheckIns = await this.getMealCheckIns();
      const updatedCheckIns = [...existingCheckIns, checkIn];
      await AsyncStorage.setItem('mealCheckIns', JSON.stringify(updatedCheckIns));
    } catch (error) {
      console.error('Error saving meal check-in:', error);
      throw error;
    }
  }

  async getMealCheckIns(): Promise<MealCheckIn[]> {
    try {
      const checkInsData = await AsyncStorage.getItem('mealCheckIns');
      return checkInsData ? JSON.parse(checkInsData) : [];
    } catch (error) {
      console.error('Error getting meal check-ins:', error);
      return [];
    }
  }

  async getMealCheckInsByPatient(patientId: string): Promise<MealCheckIn[]> {
    try {
      const allCheckIns = await this.getMealCheckIns();
      return allCheckIns.filter(checkIn => checkIn.patientId === patientId);
    } catch (error) {
      console.error('Error getting meal check-ins by patient:', error);
      return [];
    }
  }

  // Competitions
  async saveCompetition(competition: Competition): Promise<void> {
    try {
      const existingCompetitions = await this.getCompetitions();
      const updatedCompetitions = [...existingCompetitions, competition];
      await AsyncStorage.setItem('competitions', JSON.stringify(updatedCompetitions));
    } catch (error) {
      console.error('Error saving competition:', error);
      throw error;
    }
  }

  async getCompetitions(): Promise<Competition[]> {
    try {
      const competitionsData = await AsyncStorage.getItem('competitions');
      return competitionsData ? JSON.parse(competitionsData) : [];
    } catch (error) {
      console.error('Error getting competitions:', error);
      return [];
    }
  }

  async getCompetitionsByNutritionist(nutritionistId: string): Promise<Competition[]> {
    try {
      const allCompetitions = await this.getCompetitions();
      return allCompetitions.filter(competition => competition.nutritionistId === nutritionistId);
    } catch (error) {
      console.error('Error getting competitions by nutritionist:', error);
      return [];
    }
  }

  // Generic storage methods
  async saveData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      throw error;
    }
  }

  async getData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  }

  async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
}

export const storageService = new StorageService();
