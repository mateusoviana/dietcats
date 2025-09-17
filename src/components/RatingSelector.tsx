import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  maxRating?: number;
  labelStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

export default function RatingSelector({
  value,
  onValueChange,
  label,
  maxRating = 5,
  labelStyle,
  containerStyle,
}: RatingSelectorProps) {
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          style={styles.star}
          onPress={() => onValueChange(i)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={i <= value ? 'star' : 'star-outline'}
            size={32}
            color={i <= value ? '#FFD700' : '#E0E0E0'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      <Text style={styles.valueText}>
        {value} de {maxRating}
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
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    padding: 4,
    marginHorizontal: 2,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
