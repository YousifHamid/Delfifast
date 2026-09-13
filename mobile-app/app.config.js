export default {
  expo: {
    name: 'Delifast',
    slug: 'delifast',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#F3EDE1',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.vestratech.delifast',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'Delifast uses your location to find kitchens and markets near you and to deliver orders accurately.',
      },
    },
    android: {
      package: 'com.vestratech.delifast',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F3EDE1',
      },
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    },
    extra: {
      eas: { projectId: 'REPLACE_WITH_YOUR_EAS_PROJECT_ID' },
    },
    plugins: ['expo-secure-store'],
    // RTL: Arabic is toggled at the OS/app level via I18nManager in App.js
    // once you wire up a language switcher — kept off by default here so
    // English screenshots (like this mockup) render correctly out of the box.
  },
};
