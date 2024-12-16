import React from 'react';
import { View, StyleSheet } from 'react-native';
import ThemedButton from '@/components/ThemeButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

export default function SettingsScreen() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

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
    <View style={styles.container}>
      <ThemedButton type='default' onPress={handleSignOut} title='登出' />
      <ThemedButton type='danger' onPress={handleDeleteAccount} title='刪除帳號' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap:16,
    padding: 16,
  },
}); 