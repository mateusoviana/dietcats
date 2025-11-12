import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
} from 'react-native';

interface HungerSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  containerStyle?: ViewStyle;
}

const bowlsImage = require('../../assets/images/Bowls de Ração Gradualmente Cheias.png');

const HUNGER_LEVELS = [
  { label: 'Sem fome', value: 1 },
  { label: 'Pouca fome', value: 2 },
  { label: 'Fome média', value: 3 },
  { label: 'Com fome', value: 4 },
  { label: 'Muita fome', value: 5 },
];

export default function HungerSlider({
  value,
  onValueChange,
  label,
  containerStyle,
}: HungerSliderProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={styles.optionsContainer}>
        {HUNGER_LEVELS.map((level, index) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.option,
              value === level.value && styles.optionSelected,
            ]}
            onPress={() => onValueChange(level.value)}
            activeOpacity={0.7}
          >
            <View style={styles.bowlImageContainer}>
              <Image
                source={bowlsImage}
                style={{
                  width: 350, // 5 bowls × 70px
                  height: 70,
                  position: 'absolute',
                  left: -(index * 70), // Move to show specific bowl
                }}
                resizeMode="cover"
              />
            </View>
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
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    width: 90,
  },
  optionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#40916C',
  },
  bowlImageContainer: {
    width: 70,
    height: 70,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderRadius: 8,
    position: 'relative',
  },
  optionLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  optionLabelSelected: {
    color: '#40916C',
    fontWeight: '600',
  },
});

