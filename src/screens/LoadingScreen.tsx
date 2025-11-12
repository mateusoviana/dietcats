import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Logo from '../components/Logo';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
  <Logo showText={false} style={styles.logo} />
  <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
  <Text style={styles.subtitle}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#40916C', // primary.500
  },
  logo: {
    marginBottom: 12,
    width: '86%',
    height: undefined,
    aspectRatio: 1,
  },
  loader: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
});
