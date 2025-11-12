import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore errors */
});

function AppContent() {
  const { user } = useAuth();
  
  return (
    <NavigationContainer key={user ? 'authenticated' : 'unauthenticated'}>
      <StatusBar style="auto" />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // You can load fonts, make API calls, etc. here
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        // Give a tiny delay for the initial render, then hide splash
        setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {});
        }, 50);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; // keep splash visible
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
