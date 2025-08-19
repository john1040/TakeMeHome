import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
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
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import ProfileAvatar from '@/components/ProfileAvatar';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3; // 16px padding + 4px margin per item * 3 items

// Helper function to generate optimized thumbnail URLs
const getThumbnailUrl = (originalUrl: string, size: number = 200) => {
  if (!originalUrl) return '';
  // Add Supabase image transformation parameters
  return `${originalUrl}?width=${size}&height=${size}&resize=cover&quality=80`;
};

const PostImage = React.memo(({ uri }: { uri: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  
  const thumbnailUri = getThumbnailUrl(uri, Math.round(ITEM_SIZE * 2)); // 2x for retina displays

  return (
    <ThemedView style={styles.postImageContainer}>
      <Image
        source={{ uri: thumbnailUri }}
        style={styles.postImage}
        resizeMode="cover"
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
          <ThemedText style={styles.errorText}>{t('profile.failedToLoadImage')}</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
});

// Fetch user posts function
const fetchUserPosts = async (userId: string | undefined) => {
  if (!userId) throw new Error('User ID is required');
  
  const { data, error } = await supabase
    .from('post')
    .select('id, image:image(url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as { id: number; image: { url: string }[] }[];
};

export default function ProfileScreen() {
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const { t } = useTranslation();


  // Use React Query for data fetching with caching
  const {
    data: posts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-posts', userProfile?.id],
    queryFn: () => fetchUserPosts(userProfile?.id),
    enabled: !!userProfile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle query error
  React.useEffect(() => {
    if (error) {
      console.error('Error fetching posts:', error);
      Alert.alert(t('profile.error'), t('profile.failedToLoadPosts'));
    }
  }, [error]);

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
          <ThemedView style={styles.profileTopSection}>
            <ProfileAvatar
              avatarUrl={userProfile?.avatar_url}
              size={50}
              iconSize={24}
            />
            <ThemedText type="title" style={styles.username}>
              {userProfile?.username || userProfile?.email?.split('@')[0] || 'User'}
            </ThemedText>
          <ThemedText style={styles.postsCount}>{posts.length} {t('profile.posts')}</ThemedText>
        </ThemedView>
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
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={9} // 3 rows at a time
        windowSize={10}
        initialNumToRender={9}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: ITEM_SIZE + 8, // item height + margin
          offset: (ITEM_SIZE + 8) * Math.floor(index / 3),
          index,
        })}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={() => (
          <ThemedView style={styles.emptyState}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
            ) : (
              <>
                <Ionicons name="images-outline" size={48} color={Colors[colorScheme ?? 'light'].icon} />
                <ThemedText style={styles.emptyStateText}>{t('profile.noPostsYet')}</ThemedText>
              </>
            )}
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
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileTextInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
    justifyContent: 'center',
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
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 4,
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