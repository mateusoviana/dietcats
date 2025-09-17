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
      backgroundColor: '#4CAF50',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dietcats.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/dietcats_icon.png',
        backgroundColor: '#4CAF50',
      },
      package: 'com.dietcats.app',
      versionCode: 1,
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
