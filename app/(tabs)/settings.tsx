import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import ThemedButton from '@/components/ThemeButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSelector from '@/components/LanguageSelector';

export default function SettingsScreen() {
  const { userProfile } = useAuth();
  console.log(userProfile)
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['sessionAndProfile'] });
      queryClient.clear();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert(t('common.error'), t('settings.failedToSignOut'));
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccountConfirmTitle'),
      t('settings.deleteAccountConfirmMessage'),
      [
        { text: t('settings.cancel'), style: "cancel" },
        {
          text: t('settings.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              const { error: profileDeleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userProfile?.id);
              if (profileDeleteError) throw profileDeleteError;
              const { error: deleteError } = await supabase.auth.admin.deleteUser(
                userProfile?.id as string
              );
              if (deleteError) throw deleteError;
              await supabase.auth.signOut();
              router.replace('/');
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert(t('common.error'), t('settings.failedToDeleteAccount'));
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <ThemedView style={styles.headerSection}>
          <View style={[styles.headerAccent, { backgroundColor: Colors[colorScheme ?? 'light'].accent }]} />
          <ThemedText type="title" style={styles.headerTitle}>
            {t('settings.settings')}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Manage your account and preferences
          </ThemedText>
        </ThemedView>

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].surface, borderColor: Colors[colorScheme ?? 'light'].border + '20' }]}>
          <View style={styles.profileSection}>
            <View style={[styles.avatarContainer, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
              <Ionicons
                name="person"
                size={32}
                color={Colors[colorScheme ?? 'light'].surface}
              />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>
                {userProfile?.username || 'User'}
              </ThemedText>
              <ThemedText style={styles.profileEmail}>
                {userProfile?.email || 'No email'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Account Management Card */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].surface, borderColor: Colors[colorScheme ?? 'light'].border + '20' }]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="settings-outline"
              size={20}
              color={Colors[colorScheme ?? 'light'].primary}
            />
            <ThemedText style={styles.cardTitle}>{t('settings.accountManagement')}</ThemedText>
          </View>
          
          <View style={styles.cardContent}>
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: Colors[colorScheme ?? 'light'].border + '20' }]}
              onPress={handleSignOut}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: Colors[colorScheme ?? 'light'].secondary + '20' }]}>
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <ThemedText style={styles.settingItemText}>{t('settings.signOut')}</ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors[colorScheme ?? 'light'].icon}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: Colors[colorScheme ?? 'light'].error + '20' }]}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={Colors[colorScheme ?? 'light'].error}
                  />
                </View>
                <ThemedText style={[styles.settingItemText, { color: Colors[colorScheme ?? 'light'].error }]}>
                  {t('settings.deleteAccount')}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors[colorScheme ?? 'light'].error}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Settings Card */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].surface, borderColor: Colors[colorScheme ?? 'light'].border + '20' }]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="language-outline"
              size={20}
              color={Colors[colorScheme ?? 'light'].primary}
            />
            <ThemedText style={styles.cardTitle}>Language & Region</ThemedText>
          </View>
          
          <View style={styles.cardContent}>
            <LanguageSelector />
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.appInfoSection}>
          <View style={[styles.versionContainer, { backgroundColor: Colors[colorScheme ?? 'light'].accent + '15' }]}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Colors[colorScheme ?? 'light'].accent}
            />
            <ThemedText style={styles.version}>
              {t('settings.version')} • TakeMeHome
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  
  // Header Section
  headerSection: {
    marginBottom: 30,
    position: 'relative',
  },
  headerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: 60,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 16,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    marginLeft: 16,
    opacity: 0.6,
  },

  // Card Styles
  card: {
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Profile Section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    opacity: 0.6,
  },

  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // App Info Section
  appInfoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  version: {
    fontSize: 12,
    fontWeight: '500',
  },
});