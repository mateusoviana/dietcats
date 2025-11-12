import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PatientsScreen from '../screens/nutritionist/PatientsScreen';
import PatientDashboardScreen from '../screens/nutritionist/PatientDashboardScreen';

export type NutritionistPatientsStackParamList = {
  PatientsList: undefined;
  PatientDashboard: {
    patientId: string;
    patientName: string;
  };
};

const Stack = createNativeStackNavigator<NutritionistPatientsStackParamList>();

export default function NutritionistPatientsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PatientsList"
        component={PatientsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PatientDashboard"
        component={PatientDashboardScreen}
        options={{
          headerShown: true,
          title: 'Dashboard do Paciente',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}

