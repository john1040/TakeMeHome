import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import ThemedButton from '@/components/ThemeButton';
import { Alert } from 'react-native';
import { Colors, palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const PostImage = React.memo(({ uri }: { uri: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const colorScheme = useColorScheme();

  return (
    <ThemedView style={styles.postImageContainer}>
      <Image
        source={{ uri }}
        style={styles.postImage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
      {isLoading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].primary} />
        </ThemedView>
      )}
      {hasError && (
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={Colors[colorScheme ?? 'light'].error} />
          <ThemedText style={styles.errorText}>Failed to load image</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
});

export default function ProfileScreen() {
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const [posts, setPosts] = useState<{ id: number; image: { url: string }[] }[]>([]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchPosts();
    }
  }, [userProfile]);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('post')
        .select('id, image:image(url)')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
    }
  }, [userProfile]);

  const handlePostPress = (postId: number) => {
    console.log('Post Pressed', postId);
    router.push(`/post-details/${postId}`);
  };

  const renderPostItem = ({ item }: { item: { id: number; image: { url: string }[] } }) => (
    <TouchableOpacity onPress={() => handlePostPress(item.id)} style={styles.postItem}>
      <PostImage uri={item.image[0].url} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedView style={styles.profileHeader}>
          <ThemedText type="title" style={styles.username}>{userProfile?.username}</ThemedText>
          <ThemedText style={styles.postsCount}>{posts.length} Posts</ThemedText>
        </ThemedView>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color={Colors[colorScheme ?? 'light'].icon} />
        </TouchableOpacity>
      </ThemedView>
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.postsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <ThemedView style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color={Colors[colorScheme ?? 'light'].icon} />
            <ThemedText style={styles.emptyStateText}>No posts yet</ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileHeader: {
    gap: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
  },
  postsCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  postsContainer: {
    paddingVertical: 16,
  },
  postItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
  },
  postImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    opacity: 0.7,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.7,
  },
});