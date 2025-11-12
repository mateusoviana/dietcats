import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
} from 'react-native';

interface SatietySliderProps {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  containerStyle?: ViewStyle;
}

const SATIETY_LEVELS = [
  { 
    label: 'Nada saciado', 
    value: 1,
    image: require('../../assets/images/saciedade_icones/saciedade1.png')
  },
  { 
    label: 'Pouco saciado', 
    value: 2,
    image: require('../../assets/images/saciedade_icones/saciedade2.png')
  },
  { 
    label: 'Médio', 
    value: 3,
    image: require('../../assets/images/saciedade_icones/saciedade3.png')
  },
  { 
    label: 'Saciado', 
    value: 4,
    image: require('../../assets/images/saciedade_icones/saciedade4.png')
  },
  { 
    label: 'Muito saciado', 
    value: 5,
    image: require('../../assets/images/saciedade_icones/saciedade5.png')
  },
];

export default function SatietySlider({
  value,
  onValueChange,
  label,
  containerStyle,
}: SatietySliderProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={styles.optionsContainer}>
        {SATIETY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.option,
              value === level.value && styles.optionSelected,
            ]}
            onPress={() => onValueChange(level.value)}
            activeOpacity={0.7}
          >
            <View style={styles.catImageContainer}>
              <Image
                source={level.image}
                style={styles.catImage}
                resizeMode="contain"
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
  catImageContainer: {
    width: 70,
    height: 70,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catImage: {
    width: '100%',
    height: '100%',
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

