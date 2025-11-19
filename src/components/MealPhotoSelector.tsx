import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface MealPhotoSelectorProps {
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
}

export default function MealPhotoSelector({
  photoUri,
  onPhotoChange,
}: MealPhotoSelectorProps) {
  const requestPermission = async (permissionType: 'camera' | 'gallery') => {
    const permissionRequest =
      permissionType === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permissionRequest();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Negada',
        `Precisamos de acesso à ${
          permissionType === 'camera' ? 'câmera' : 'galeria'
        } para continuar.`
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onPhotoChange(result.assets[0].uri);
    }
  };

  const handleChooseFromGallery = async () => {
    const hasPermission = await requestPermission('gallery');
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onPhotoChange(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Foto da Refeição (Opcional)</Text>
      {photoUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: photoUri }} style={styles.image} />
          <TouchableOpacity
            onPress={handleRemovePhoto}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={28} color="#E53935" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleChooseFromGallery}
          >
            <Ionicons name="images" size={24} color="#40916C" />
            <Text style={styles.optionText}>Escolher da Galeria</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={24} color="#40916C" />
            <Text style={styles.optionText}>Tirar Foto</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
