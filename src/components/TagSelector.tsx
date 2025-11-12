import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const defaultTags = [
  'Saudável',
  'Vegano',
  'Vegetariano',
  'Fast Food',
  'Cheat Meal',
  'PF',
];

export default function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);

  const allAvailableTags = [...defaultTags, ...customTags];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      // Add tag
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !allAvailableTags.includes(trimmedTag)) {
      setCustomTags([...customTags, trimmedTag]);
      onTagsChange([...selectedTags, trimmedTag]);
      setCustomTag('');
      setShowCustomModal(false);
    }
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags(customTags.filter(t => t !== tag));
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <View style={styles.tagsContainer}>
        {allAvailableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const isCustom = customTags.includes(tag);
          return (
            <View key={tag} style={styles.tagWrapper}>
              <TouchableOpacity
                style={[
                  styles.tag,
                  isSelected && styles.tagSelected,
                ]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tagText,
                    isSelected && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
                {isCustom && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      removeCustomTag(tag);
                    }}
                    style={styles.removeIconButton}
                  >
                    <Ionicons 
                      name="close-circle" 
                      size={16} 
                      color={isSelected ? '#FFFFFF' : '#666'}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
        
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
                <Text style={styles.modalTitle}>Adicionar Tag Personalizada</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: Caseiro, Diet, Integral..."
                  placeholderTextColor="#999"
                  value={customTag}
                  onChangeText={setCustomTag}
                  autoFocus
                  maxLength={20}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonCancel}
                    onPress={() => {
                      setShowCustomModal(false);
                      setCustomTag('');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButtonConfirm,
                      !customTag.trim() && styles.modalButtonDisabled,
                    ]}
                    onPress={handleAddCustomTag}
                    disabled={!customTag.trim()}
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
  tagWrapper: {
    position: 'relative',
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
    gap: 6,
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
  removeIconButton: {
    marginLeft: 2,
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

