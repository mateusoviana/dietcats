import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CompetitionsScreen from '../screens/patient/CompetitionsScreen';
import PatientCompetitionDetailsScreen from '../screens/patient/PatientCompetitionDetailsScreen';

export type PatientCompetitionsStackParamList = {
  CompetitionsList: undefined;
  CompetitionDetails: {
    competitionId: string;
  };
};

const Stack = createNativeStackNavigator<PatientCompetitionsStackParamList>();

export default function PatientCompetitionsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CompetitionsList"
        component={CompetitionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompetitionDetails"
        component={PatientCompetitionDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

