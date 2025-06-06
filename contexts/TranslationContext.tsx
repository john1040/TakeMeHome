import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../lib/i18n';
import { getDeviceLanguage } from '../lib/deviceLocale';

interface TranslationContextType {
  locale: string;
  t: (key: string, options?: any) => string;
  changeLanguage: (newLocale: string) => void;
  getCurrentLanguage: () => string;
  isRTL: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Function to determine if the current locale is RTL
const getIsRTL = (locale: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.some(lang => locale.startsWith(lang));
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState(i18n.locale);
  const [isRTL, setIsRTL] = useState(getIsRTL(i18n.locale));

  useEffect(() => {
    // Initialize with current i18n locale
    setLocale(i18n.locale);
    setIsRTL(getIsRTL(i18n.locale));
  }, []);

  const t = (key: string, options?: any) => {
    return i18n.t(key, options);
  };

  const changeLanguage = (newLocale: string) => {
    i18n.locale = newLocale;
    setLocale(newLocale);
    setIsRTL(getIsRTL(newLocale));
  };

  const getCurrentLanguage = () => {
    return i18n.locale;
  };

  const value: TranslationContextType = {
    locale,
    t,
    changeLanguage,
    getCurrentLanguage,
    isRTL,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};