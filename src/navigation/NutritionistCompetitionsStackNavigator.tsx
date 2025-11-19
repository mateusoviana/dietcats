import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CompetitionsScreen from '../screens/nutritionist/CompetitionsScreen';
import CompetitionDetailsScreen from '../screens/nutritionist/CompetitionDetailsScreen';

export type NutritionistCompetitionsStackParamList = {
  CompetitionsList: undefined;
  CompetitionDetails: {
    competitionId: string;
  };
};

const Stack = createNativeStackNavigator<NutritionistCompetitionsStackParamList>();

export default function NutritionistCompetitionsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CompetitionsList"
        component={CompetitionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompetitionDetails"
        component={CompetitionDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

