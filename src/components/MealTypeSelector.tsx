import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MealTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const defaultMealTypes = [
  { label: 'Almoço', value: 'Almoço' },
  { label: 'Jantar', value: 'Jantar' },
  { label: 'Lanche', value: 'Lanche' },
  { label: 'Pré-treino', value: 'Pré-treino' },
];

export default function MealTypeSelector({ value, onValueChange }: MealTypeSelectorProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleAddCustom = () => {
    if (customValue.trim()) {
      onValueChange(customValue.trim());
      setCustomValue('');
      setShowCustomModal(false);
    }
  };

  const isCustomValue = !defaultMealTypes.some(type => type.value === value) && value !== '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tipo de Refeição</Text>
      <View style={styles.tagsContainer}>
        {defaultMealTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.tag,
              value === type.value && styles.tagSelected,
            ]}
            onPress={() => onValueChange(type.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tagText,
                value === type.value && styles.tagTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        {isCustomValue && (
          <View style={[styles.tag, styles.tagSelected]}>
            <Text style={[styles.tagText, styles.tagTextSelected]}>
              {value}
            </Text>
            <TouchableOpacity
              onPress={() => onValueChange('')}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCustomModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color="#40916C" />
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCustomModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Adicionar Refeição</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: Café da manhã"
                  placeholderTextColor="#999"
                  value={customValue}
                  onChangeText={setCustomValue}
                  autoFocus
                  maxLength={30}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonCancel}
                    onPress={() => {
                      setShowCustomModal(false);
                      setCustomValue('');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButtonConfirm,
                      !customValue.trim() && styles.modalButtonDisabled,
                    ]}
                    onPress={handleAddCustom}
                    disabled={!customValue.trim()}
                  >
                    <Text style={styles.modalButtonConfirmText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagSelected: {
    backgroundColor: '#40916C',
    borderColor: '#40916C',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  removeButton: {
    marginLeft: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#40916C',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#40916C',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#40916C',
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonDisabled: {
    backgroundColor: '#B9E7C9',
    opacity: 0.5,
  },
});
