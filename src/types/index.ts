export type UserType = 'patient' | 'nutritionist';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  profilePicture?: string;
  createdAt: string;
}

export interface Patient extends User {
  userType: 'patient';
  mealTimes: MealTime[];
  nutritionistId?: string;
  notificationPreferences: NotificationPreferences;
}

export interface Nutritionist extends User {
  userType: 'nutritionist';
  patients: string[];
  associationCode: string;
}

export interface MealTime {
  id: string;
  name: string;
  time: string; // Format: "HH:MM"
}

export interface NotificationPreferences {
  mealReminders: boolean;
  competitionUpdates: boolean;
  generalUpdates: boolean;
}

export interface MealCheckIn {
  id: string;
  patientId: string;
  mealType: string;
  timestamp: string;
  photo?: string;
  hungerRating: number; // 1-5
  satietyRating: number; // 1-5
  satisfactionRating: number; // 1-5
  tag?: string;
  observations?: string;
}

export interface Competition {
  id: string;
  nutritionistId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  participants: string[]; // Patient IDs
  scoringCriteria: ScoringCriteria;
  createdAt: string;
}

export interface ScoringCriteria {
  checkInPoints: number;
  consistencyBonus: number;
  ratingBonus: number;
}

export interface CompetitionFeed {
  id: string;
  competitionId: string;
  patientId: string;
  patientName: string;
  mealCheckIn: MealCheckIn;
  timestamp: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: UserType;
}

export type RootStackParamList = {
  Auth: undefined;
  PatientTabs: undefined;
  NutritionistTabs: undefined;
  MealCheckIn: undefined;
  PatientHistory: undefined;
  CompetitionDetails: { competitionId: string };
  PatientDashboard: { patientId: string };
  CreateCompetition: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type PatientTabParamList = {
  Home: undefined;
  CheckIn: undefined;
  History: undefined;
  Competitions: undefined;
  Profile: undefined;
};

export type NutritionistTabParamList = {
  Patients: undefined;
  Competitions: undefined;
  CreateCompetition: undefined;
  Profile: undefined;
};
