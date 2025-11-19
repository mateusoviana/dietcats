import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/nutritionist/ProfileScreen';
import ReportsScreen from '../screens/nutritionist/ReportsScreen';

export type NutritionistProfileStackParamList = {
  ProfileMain: undefined;
  Reports: undefined;
};

const Stack = createNativeStackNavigator<NutritionistProfileStackParamList>();

export default function NutritionistProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

