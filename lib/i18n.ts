import { I18n } from 'i18n-js';
import { getDeviceLanguage } from './deviceLocale';

import en from '../locales/en.json';
import zh from '../locales/zh-Hant.json';

const i18n = new I18n({
  en,
  'zh-Hant': zh,
  zh: zh, // Fallback for zh locales
});

// Set the key-value pairs for the different languages you want to support.
i18n.translations = {
  en,
  'zh-Hant': zh,
  zh: zh,
};

// Set the locale based on device language preference
const deviceLanguage = getDeviceLanguage();
i18n.locale = deviceLanguage;

// When a value is missing from a language it'll fall back to another language with the key present.
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;