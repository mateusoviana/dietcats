import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import PatientTabNavigator from './PatientTabNavigator';
import NutritionistTabNavigator from './NutritionistTabNavigator';
import LoadingScreen from '../screens/LoadingScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const authContext = useContext(AuthContext);
  const { user, isLoading } = authContext || { user: null, isLoading: true };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Use a key that changes when user changes to force re-render
  const navigatorKey = user ? `authenticated-${user.userType}` : 'unauthenticated';

  return (
    <Stack.Navigator 
      key={navigatorKey}
      screenOptions={{ headerShown: false }}
    >
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user.userType === 'patient' ? (
        <Stack.Screen name="PatientTabs" component={PatientTabNavigator} />
      ) : (
        <Stack.Screen name="NutritionistTabs" component={NutritionistTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
