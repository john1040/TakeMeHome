import React from 'react';
import { StyleSheet } from 'react-native';
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

export default function SettingsScreen() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['sessionAndProfile'] });
      queryClient.clear();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>設定</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>帳號管理</ThemedText>
        
        <ThemedView style={styles.buttonContainer}>
          <ThemedView style={styles.buttonWrapper}>
            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors[colorScheme ?? 'light'].text}
              style={styles.buttonIcon}
            />
            <ThemedButton
              type='default'
              onPress={handleSignOut}
              title='登出'
            />
          </ThemedView>
          
          <ThemedView style={styles.buttonWrapper}>
            <Ionicons
              name="trash-outline"
              size={20}
              color={Colors[colorScheme ?? 'light'].error}
              style={styles.buttonIcon}
            />
            <ThemedButton
              type='error'
              onPress={handleDeleteAccount}
              title='刪除帳號'
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.footer}>
        <ThemedText style={styles.version}>版本 1.0.0</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    opacity: 0.7,
  },
  buttonContainer: {
    gap: 12,
  },
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonIcon: {
    width: 20,
    height: 20,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  version: {
    fontSize: 14,
    opacity: 0.5,
  },
});