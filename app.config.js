/**
 * Dynamic Expo config — replaces app.json so we can interpolate
 * environment variables (in particular the Google Maps API key).
 *
 * Required env vars (typically set in arryde-mobile/.env):
 *   EXPO_PUBLIC_GOOGLE_API_KEY  – Google API key with Maps SDK for Android
 *                                 + Places API (New) enabled.
 *
 * Native Android Maps reads the key via the `android.config.googleMaps.apiKey`
 * field below (baked into the build). Runtime JS code (Places HTTP calls)
 * reads the same key via `process.env.EXPO_PUBLIC_GOOGLE_API_KEY`.
 */
module.exports = () => ({
  expo: {
    name: 'arryde-mobile',
    slug: 'arryde-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      // iOS Google Maps key goes here when we ship iOS:
      // config: { googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      package: 'com.cornetj2.arrydemobile',
      // Firebase Cloud Messaging credentials — required for Android push.
      // Download from Firebase Console: Project Settings → Your apps →
      // Android app → google-services.json.
      googleServicesFile: './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      // Registers react-native-maps' native module AND passes the Google Maps
      // API key as a plugin prop. The plugin reads from `androidGoogleMapsApiKey`
      // (NOT from `android.config.googleMaps.apiKey`). If the prop is missing,
      // the plugin actively *removes* the meta-data tag from AndroidManifest,
      // which is what caused the "API key not found" runtime crash.
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
        },
      ],
      // Push notifications. Without this plugin, runtime tries to use Expo Go's
      // bundled config and falls back to silent failure. No props needed for
      // the default (FCM via Expo's push service) configuration.
      'expo-notifications',
    ],
    extra: {
      eas: {
        projectId: '136bf4e4-dbb8-4524-854c-2c64ca0957b8',
      },
    },
  },
});
