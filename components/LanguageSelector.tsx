import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
      {languages.map((language, index) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.languageOption,
            { borderBottomColor: Colors[colorScheme ?? 'light'].border + '20' },
            index === languages.length - 1 && styles.lastOption,
            currentLang.startsWith(language.code) && [
              styles.selectedOption,
              { backgroundColor: Colors[colorScheme ?? 'light'].primary + '10' }
            ],
          ]}
          onPress={() => handleLanguageChange(language.code)}
        >
          <View style={styles.languageOptionLeft}>
            <View style={[
              styles.languageIconContainer,
              { backgroundColor: Colors[colorScheme ?? 'light'].secondary + '20' }
            ]}>
              <Ionicons
                name="language"
                size={18}
                color={Colors[colorScheme ?? 'light'].primary}
              />
            </View>
            <View style={styles.languageInfo}>
              <ThemedText style={[
                styles.languageName,
                currentLang.startsWith(language.code) && {
                  color: Colors[colorScheme ?? 'light'].primary,
                  fontWeight: '600'
                }
              ]}>
                {language.nativeName}
              </ThemedText>
              <ThemedText style={styles.languageSubtitle}>{language.name}</ThemedText>
            </View>
          </View>
          {currentLang.startsWith(language.code) && (
            <View style={[
              styles.checkmarkContainer,
              { backgroundColor: Colors[colorScheme ?? 'light'].primary }
            ]}>
              <Ionicons
                name="checkmark"
                size={16}
                color={Colors[colorScheme ?? 'light'].surface}
              />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    borderRadius: 8,
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LanguageSelector;