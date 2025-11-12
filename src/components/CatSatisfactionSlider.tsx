import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface CatSatisfactionSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  containerStyle?: ViewStyle;
}

const SATISFACTION_LEVELS = [
  { emoji: '😿', label: 'Muito insatisfeito', value: 1 },
  { emoji: '😾', label: 'Insatisfeito', value: 2 },
  { emoji: '😺', label: 'Neutro', value: 3 },
  { emoji: '😸', label: 'Satisfeito', value: 4 },
  { emoji: '😻', label: 'Muito satisfeito', value: 5 },
];

export default function CatSatisfactionSlider({
  value,
  onValueChange,
  label,
  containerStyle,
}: CatSatisfactionSliderProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={styles.optionsContainer}>
        {SATISFACTION_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.option,
              value === level.value && styles.optionSelected,
            ]}
            onPress={() => onValueChange(level.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{level.emoji}</Text>
            <Text style={[
              styles.optionLabel,
              value === level.value && styles.optionLabelSelected,
            ]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  optionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#40916C',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#40916C',
    fontWeight: '600',
  },
});

