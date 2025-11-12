import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SuccessModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onRegisterAnother: () => void;
  onGoHome: () => void;
}

export default function SuccessModal({
  visible,
  title = 'Sucesso!',
  message = 'Check-in registrado com sucesso!',
  onRegisterAnother,
  onGoHome,
}: SuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onGoHome}
    >
      <TouchableWithoutFeedback onPress={onGoHome}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#40916C" />
              </View>
              
              <Text style={styles.title}>{title}</Text>
              
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={onRegisterAnother}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#40916C" />
                  <Text style={styles.buttonSecondaryText}>Registrar Outra</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={onGoHome}
                  activeOpacity={0.8}
                >
                  <Ionicons name="home-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonPrimaryText}>Voltar ao Início</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 50,
  },
  buttonPrimary: {
    backgroundColor: '#40916C',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#40916C',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonSecondaryText: {
    color: '#40916C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

