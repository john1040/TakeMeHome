import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, Alert } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@rneui/themed';
import { router } from 'expo-router';

export default function TabTwoScreen() {
  const { userProfile, isLoading } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Add the API call to delete the user account here
              console.log(userProfile?.id)
              const { error: profileDeleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userProfile?.id);
              if (profileDeleteError) throw profileDeleteError;
              const { error: deleteError } = await supabase.auth.admin.deleteUser(
                userProfile?.id as string
              );
              
              if (deleteError){
                console.log(deleteError)
                 throw deleteError;}
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
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome Back {userProfile?.username}</ThemedText>
      </ThemedView>
      <Button onPress={handleSignOut} style={styles.button}>
        Sign Out
      </Button>
      <Button onPress={handleDeleteAccount} buttonStyle={styles.deleteButton} titleStyle={styles.deleteButtonText}>
        Delete Account
      </Button>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    marginTop: 10,
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: 'red',
  },
  deleteButtonText: {
    color: 'white',
  },
});