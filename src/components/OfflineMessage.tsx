import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';

export default function OfflineMessage() {
  return (
    <Card style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={64} color="#E0E0E0" />
      <Text style={styles.title}>Sem conexão com a internet</Text>
      <Text style={styles.message}>
        Verifique sua conexão e tente novamente.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    margin: 16,
    minHeight: 200,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

