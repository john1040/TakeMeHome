import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export const LanguageSelector: React.FC = () => {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();
  const colorScheme = useColorScheme();
  const currentLang = getCurrentLanguage();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh-Hant', name: 'Traditional Chinese', nativeName: '繁體中文' },
  ];

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>{t('settings.language')}</ThemedText>
      {languages.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.languageOption,
            currentLang.startsWith(language.code) && styles.selectedOption,
          ]}
          onPress={() => handleLanguageChange(language.code)}
        >
          <ThemedView style={styles.languageInfo}>
            <ThemedText style={styles.languageName}>{language.nativeName}</ThemedText>
            <ThemedText style={styles.languageSubtitle}>{language.name}</ThemedText>
          </ThemedView>
          {currentLang.startsWith(language.code) && (
            <Ionicons
              name="checkmark"
              size={20}
              color={Colors[colorScheme ?? 'light'].primary}
            />
          )}
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    opacity: 0.7,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
});

export default LanguageSelector;