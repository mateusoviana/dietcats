import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  margin?: number;
}

export default function Card({
  children,
  style,
  onPress,
  padding = 16,
  margin = 8,
  ...props
}: CardProps) {
  const cardStyle = [
    styles.card,
    {
      padding,
      margin,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} {...(props as any)}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...(props as any)}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
