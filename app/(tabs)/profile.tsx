import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import ThemedButton from '@/components/ThemeButton';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

export default function TabTwoScreen() {
  const { userProfile, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear React Query cache
      await queryClient.invalidateQueries({ queryKey: ['sessionAndProfile'] });
      queryClient.clear();

      // Navigate to auth screen
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
        {
          text: "Cancel",
          style: "cancel"
        },
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
              
              if (deleteError) {
                console.log(deleteError);
                throw deleteError;
              }
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

  const handleNavigateToMyPosts = () => {
    router.push('/my-posts');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">我的帳號 {userProfile?.username}</ThemedText>
      </ThemedView>
      <ThemedButton type='default' onPress={handleNavigateToMyPosts} title='我的貼文' />
      <ThemedButton type='default' onPress={handleSignOut} title='登出' />
      <ThemedButton type='danger' onPress={handleDeleteAccount} title='刪除帳號' />
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
});