import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = () => {
    const baseStyle: ViewStyle[] = [styles.container];
    if (error) baseStyle.push(styles.errorContainer);
    if (isFocused) baseStyle.push(styles.focusedContainer);
    return [...baseStyle, containerStyle];
  };

  const getInputStyle = () => {
    const baseStyle: TextStyle[] = [styles.input];
    if (leftIcon) baseStyle.push(styles.inputWithLeftIcon);
    if (rightIcon) baseStyle.push(styles.inputWithRightIcon);
    return [...baseStyle, inputStyle, style];
  };

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={getInputStyle()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9E9E9E"
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  errorContainer: {
    borderColor: '#F44336',
  },
  focusedContainer: {
    borderColor: '#4CAF50',
  },
});
