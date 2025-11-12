import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import NutritionistPatientsStackNavigator from './NutritionistPatientsStackNavigator';
import CompetitionsScreen from '../screens/nutritionist/CompetitionsScreen';
import CreateCompetitionScreen from '../screens/nutritionist/CreateCompetitionScreen';
import ProfileScreen from '../screens/nutritionist/ProfileScreen';
import { NutritionistTabParamList } from '../types';

const Tab = createBottomTabNavigator<NutritionistTabParamList>();

export default function NutritionistTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Patients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Competitions') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'CreateCompetition') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#40916C',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Patients" 
        component={NutritionistPatientsStackNavigator} 
        options={{ title: 'Pacientes' }} 
      />
      <Tab.Screen name="Competitions" component={CompetitionsScreen} options={{ title: 'Competições' }} />
      <Tab.Screen name="CreateCompetition" component={CreateCompetitionScreen} options={{ title: 'Criar' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
