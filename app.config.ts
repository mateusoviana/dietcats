import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

  return {
    ...config,
    name: 'DietCats',
    slug: 'dietcats',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/dietcats_icon.png',
    userInterfaceStyle: 'light',
    scheme: 'dietcats',
    splash: {
      image: './assets/images/dietcats.png',
      resizeMode: 'cover',
      backgroundColor: '#40916C',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dietcats.app',
      infoPlist: {
        NSCameraUsageDescription: 'Este app precisa acessar sua câmera para tirar fotos das refeições.',
        NSPhotoLibraryUsageDescription: 'Este app precisa acessar sua galeria para escolher fotos das refeições.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/dietcats_icon.png',
        backgroundColor: '#40916C',
      },
      package: 'com.dietcats.app',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-image-picker',
    ],
    extra: {
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
    },
  };
};
