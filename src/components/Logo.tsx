import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ImageStyle } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: ImageStyle | ImageStyle[];
}

export default function Logo({ size = 'medium', showText = true, style }: LogoProps) {
  const screenWidth = Dimensions.get('window').width;

  const baseWidth = (() => {
    switch (size) {
      case 'small': return Math.min(140, screenWidth * 0.5);
      case 'large': return Math.min(260, screenWidth * 0.8);
      default: return Math.min(200, screenWidth * 0.7);
    }
  })();

  // Images are square in the repository (1024x1024 etc.) - use aspectRatio 1 for responsive sizing
  const computedStyle: ImageStyle = { width: baseWidth, height: undefined, aspectRatio: 1 };

  // choose image: use the full dietcats.png so native splash and loading screen match
  const imageSource = require('../../assets/images/dietcats.png');

  return (
    <View style={styles.container}>
      <Image 
        source={imageSource}
        style={[styles.logo, computedStyle, style as any]}
        resizeMode="contain"
        onError={(error) => {
          console.log('Erro ao carregar logo:', error);
          // Fallback para texto se a imagem não carregar
        }}
        onLoad={() => console.log('Logo carregada com sucesso')}
      />
      {showText && (
        <Text style={styles.text}>DietCats</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 8,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
