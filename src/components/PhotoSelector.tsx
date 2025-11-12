import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ImageCropper from './ImageCropper';

interface PhotoSelectorProps {
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
}

export default function PhotoSelector({ photoUri, onPhotoChange }: PhotoSelectorProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Negada',
        'Precisamos de acesso à câmera para tirar fotos.'
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Negada',
        'Precisamos de acesso à galeria para escolher fotos.'
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    setShowOptions(false);
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS !== 'web', // Mobile usa editor nativo
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      
      // Na web, abre o cropper customizado
      if (Platform.OS === 'web') {
        setTempImageUri(uri);
        setShowCropper(true);
      } else {
        // Mobile já editou, salva direto
        onPhotoChange(uri);
      }
    }
  };

  const handleChooseFromGallery = async () => {
    setShowOptions(false);
    
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS !== 'web', // Mobile usa editor nativo
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      
      // Na web, abre o cropper customizado
      if (Platform.OS === 'web') {
        setTempImageUri(uri);
        setShowCropper(true);
      } else {
        // Mobile já editou, salva direto
        onPhotoChange(uri);
      }
    }
  };

  const handleCropComplete = (croppedUri: string) => {
    setShowCropper(false);
    setTempImageUri(null);
    onPhotoChange(croppedUri);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageUri(null);
  };

  const handleRemovePhoto = () => {
    onPhotoChange(null);
    setShowOptions(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Foto da Refeição</Text>

      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={() => setShowOptions(true)}
            >
              <Ionicons name="camera" size={20} color="#40916C" />
              <Text style={styles.changePhotoText}>Alterar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={handleRemovePhoto}
            >
              <Ionicons name="trash" size={20} color="#F44336" />
              <Text style={styles.removePhotoText}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={() => setShowOptions(true)}
        >
          <Ionicons name="camera" size={40} color="#40916C" />
          <Text style={styles.addPhotoText}>Adicionar Foto</Text>
        </TouchableOpacity>
      )}

      {/* Modal de opções */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsModal}>
            <Text style={styles.optionsTitle}>Escolha uma opção</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleChooseFromGallery}
            >
              <Ionicons name="images" size={24} color="#40916C" />
              <Text style={styles.optionText}>Escolher da Galeria</Text>
            </TouchableOpacity>

            {photoUri && (
              <TouchableOpacity
                style={[styles.optionButton, styles.removeOption]}
                onPress={handleRemovePhoto}
              >
                <Ionicons name="trash" size={24} color="#F44336" />
                <Text style={[styles.optionText, styles.removeOptionText]}>
                  Remover Foto
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Cropper para Web */}
      {Platform.OS === 'web' && tempImageUri && (
        <ImageCropper
          imageUri={tempImageUri}
          visible={showCropper}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
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
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  photoActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#D8F3DC',
    borderRadius: 8,
    gap: 6,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#40916C',
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFE0E0',
    borderRadius: 8,
    gap: 6,
  },
  removePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  addPhotoButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#40916C',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  removeOption: {
    backgroundColor: '#FFE0E0',
  },
  removeOptionText: {
    color: '#F44336',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

