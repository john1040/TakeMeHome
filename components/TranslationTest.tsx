import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useTranslation } from '@/hooks/useTranslation';

export const TranslationTest: React.FC = () => {
  const { t, locale, changeLanguage } = useTranslation();

  const toggleLanguage = () => {
    const newLocale = locale.startsWith('zh') ? 'en' : 'zh-Hant';
    changeLanguage(newLocale);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>i18n Test</ThemedText>
      <ThemedText>Current locale: {locale}</ThemedText>
      <ThemedText>Welcome text: {t('auth.welcomeBack')}</ThemedText>
      <ThemedText>Sign in text: {t('auth.signIn')}</ThemedText>
      <ThemedText>Settings text: {t('settings.settings')}</ThemedText>
      
      <TouchableOpacity onPress={toggleLanguage} style={styles.button}>
        <ThemedText style={styles.buttonText}>
          Switch to {locale.startsWith('zh') ? 'English' : 'Traditional Chinese'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TranslationTest;