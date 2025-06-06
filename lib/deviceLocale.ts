import { Platform, NativeModules } from 'react-native';

export const getDeviceLanguage = (): 'en' | 'zh-Hant' => {
  try {
    let locale = 'en';
    
    if (Platform.OS === 'ios') {
      // Try to get iOS locale
      const iosLocale = NativeModules.SettingsManager?.settings?.AppleLocale || 
                       NativeModules.SettingsManager?.settings?.AppleLanguages?.[0];
      if (iosLocale) {
        locale = iosLocale;
      }
    } else if (Platform.OS === 'android') {
      // Try to get Android locale
      const androidLocale = NativeModules.I18nManager?.localeIdentifier;
      if (androidLocale) {
        locale = androidLocale;
      }
    }
    
    // Check if locale is Chinese
    if (locale.toLowerCase().includes('zh') || 
        locale.toLowerCase().includes('chinese') ||
        locale.toLowerCase().includes('taiwan') ||
        locale.toLowerCase().includes('hk') ||
        locale.toLowerCase().includes('mo')) {
      return 'zh-Hant';
    }
    
    return 'en';
  } catch (error) {
    console.log('Could not determine device language, defaulting to English');
    return 'en';
  }
};

export const getCurrentSystemLanguage = (): string => {
  const lang = getDeviceLanguage();
  return lang === 'zh-Hant' ? 'Traditional Chinese' : 'English';
};