import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface PlateRatingProps {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  containerStyle?: ViewStyle;
}

// Unicode plate emojis representing different fullness levels
const PLATE_LEVELS = ['🍽️', '🍽️', '🍽️', '🍽️', '🍽️'];

export default function PlateRating({
  value,
  onValueChange,
  label,
  containerStyle,
}: PlateRatingProps) {
  const getPlateEmoji = (index: number) => {
    // Index is 0-4, value is 1-5
    if (index + 1 <= value) {
      // Show progressively fuller plates
      switch (value) {
        case 1:
          return '🍽️'; // Empty plate
        case 2:
          return '🥗'; // Salad (light)
        case 3:
          return '🍱'; // Bento (medium)
        case 4:
          return '🍲'; // Full pot
        case 5:
          return '🍜'; // Very full bowl
        default:
          return '🍽️';
      }
    }
    return '⚪'; // Empty circle for unselected
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.platesContainer}>
        {PLATE_LEVELS.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={styles.plate}
            onPress={() => onValueChange(index + 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.plateEmoji}>
              {index + 1 <= value ? getPlateEmoji(index) : '⚪'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.valueText}>
        Nível {value} de 5
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  platesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plate: {
    padding: 8,
    marginHorizontal: 4,
  },
  plateEmoji: {
    fontSize: 36,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});



