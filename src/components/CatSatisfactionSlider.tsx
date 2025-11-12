import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
  Easing,
} from 'react-native';
import Slider from '@react-native-community/slider';

interface CatSatisfactionSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  containerStyle?: ViewStyle;
}

export default function CatSatisfactionSlider({
  value,
  onValueChange,
  label,
  containerStyle,
}: CatSatisfactionSliderProps) {
  // Animated values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const backgroundColorAnim = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    // Bounce animation when value changes
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Smooth background color transition
    Animated.timing(backgroundColorAnim, {
      toValue: value,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const getCatEmoji = (rating: number) => {
    if (rating <= 1) return '😿';
    if (rating <= 2) return '😾';
    if (rating <= 3) return '😺';
    if (rating <= 4) return '😸';
    return '😻';
  };

  const getCatMessage = (rating: number) => {
    if (rating <= 1) return 'Muito insatisfeito';
    if (rating <= 2) return 'Insatisfeito';
    if (rating <= 3) return 'Neutro';
    if (rating <= 4) return 'Satisfeito';
    return 'Muito satisfeito';
  };

  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [1, 2, 3, 4, 5],
    outputRange: ['#FFE0E0', '#FFE8CC', '#FFF8DC', '#E8F5E9', '#C8E6C9'],
  });

  const borderColor = backgroundColorAnim.interpolate({
    inputRange: [1, 2, 3, 4, 5],
    outputRange: ['#FF6B6B', '#FFA94D', '#FFD43B', '#74C69D', '#40916C'],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      
      <Animated.View
        style={[
          styles.catContainer,
          {
            backgroundColor,
            borderColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.catEmoji}>{getCatEmoji(value)}</Text>
        <Text style={styles.messageText}>{getCatMessage(value)}</Text>
      </Animated.View>
      
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#52B788"
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor="#40916C"
      />
      
      <View style={styles.labelsContainer}>
        <View style={styles.labelItem}>
          <Text style={styles.sliderLabel}>😿</Text>
          <Text style={styles.sliderLabelText}>Triste</Text>
        </View>
        <View style={styles.labelItem}>
          <Text style={styles.sliderLabel}>😻</Text>
          <Text style={styles.sliderLabelText}>Feliz</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  catContainer: {
    borderRadius: 90,
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  catEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#40916C',
    textAlign: 'center',
    marginTop: 4,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 8,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  labelItem: {
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 32,
    marginBottom: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

