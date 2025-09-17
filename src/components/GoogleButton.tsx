import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type Props = {
  title?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function GoogleButton({
  title = 'Entrar com Google',
  onPress,
  loading = false,
  disabled = false,
  style,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.container, disabled ? styles.containerDisabled : null, style]}
    >
      {loading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <FontAwesome name="google" size={18} color="#4285F4" />
          </View>
          <Text style={styles.text}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DADCE0',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
    marginRight: 8,
  },
  text: {
    color: '#3C4043',
    fontSize: 16,
    fontWeight: '600',
  },
});

