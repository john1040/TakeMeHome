import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator, StyleSheet, RefreshControl, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { palette } from '@/constants/Colors';

const POSTS_PER_PAGE = 10;

interface RawPost {
  id: string;
  description: string;
  created_at: string;
  street_name: string;
  user_id: string;
  category?: string;
  availability_status?: string;
  image: { url: string }[];
  profiles: { username: string }[];
}

interface Post extends Omit<RawPost, 'profiles'> {
  username: string;
}

interface PostResponse {
  posts: Post[];
  nextPage: number | undefined;
}

export default function PostFeed() {
  const [userId, setUserId] = useState<string | null>(null);
  const onEndReachedCalledDuringMomentum = useRef(true);
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => router.push('/(app)/chats')}
          style={styles.chatButton}
        >
          <ThemedView variant="surface" style={styles.chatButtonContainer}>
            <MessageCircle size={24} color={palette.teal} />
          </ThemedView>
        </TouchableOpacity>
      ),
    });
  }, []);

  // Query for user ID - runs in parallel with posts
  const { data: userData } = useQuery({
    queryKey: ['userId'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        return user.id;
      }
      return null;
    },
    staleTime: 1000 * 60 * 5, // Consider user data fresh for 5 minutes
  });

  // Query for posts with infinite loading - runs immediately
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['posts'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<PostResponse> => {
      // Use the optimized view for maximum performance
      const { data, error } = await supabase
        .from('post_with_details')
        .select('*')
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (error) throw error;

      const posts = (data || []).map(post => ({
        ...post,
        likeCount: post.like_count || 0,
        comments: Array.isArray(post.comments) ? post.comments : [],
        image: Array.isArray(post.image) ? post.image : []
      }));

      return {
        posts,
        nextPage: data && data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 5, // Consider posts fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists
    // Prefetch next page aggressively for better UX
    getPreviousPageParam: (firstPage, pages) => firstPage.nextPage ? pages.length - 1 : undefined,
    // Enable background refetch for fresh data
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  const renderItem = useCallback(({ item }: { item: Post }) => (
    <PostItem
      post={item}
      userId={userId || ''} // Provide empty string fallback to prevent render delays
      showDelete={false}
      onDelete={() => refetch()}
    />
  ), [userId, refetch]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <ThemedView style={styles.loaderContainer} variant="surface">
        <ActivityIndicator size="large" color={palette.teal} />
      </ThemedView>
    );
  };

  const handleLoadMore = useCallback(() => {
    if (!onEndReachedCalledDuringMomentum.current && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderEmpty = () => (
    <ThemedView style={styles.emptyContainer} variant="surface">
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No Posts Yet
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        Be the first to share something in your area!
      </ThemedText>
    </ThemedView>
  );

  const renderLoadingSkeleton = () => (
    <ThemedView style={styles.container} variant="surface">
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonUserInfo}>
              <View style={styles.skeletonUsername} />
              <View style={styles.skeletonLocation} />
            </View>
          </View>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonText} />
          <View style={styles.skeletonActions}>
            <View style={styles.skeletonButton} />
            <View style={styles.skeletonButton} />
          </View>
        </View>
      ))}
    </ThemedView>
  );

  if (isLoading && !data) {
    return renderLoadingSkeleton();
  }

  return (
    <ThemedView style={styles.container} variant="surface">
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onMomentumScrollBegin={() => { onEndReachedCalledDuringMomentum.current = false; }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={palette.teal}
            colors={[palette.teal, palette.sage]}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    marginRight: 16,
  },
  chatButtonContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: `${palette.teal}10`,
    borderWidth: 1,
    borderColor: palette.teal,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyTitle: {
    color: palette.teal,
    marginBottom: 8,
  },
  emptyText: {
    color: palette.carbon,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: `${palette.teal}20`,
    marginVertical: 8,
  },
  skeletonCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  skeletonUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonUsername: {
    height: 16,
    width: '60%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonLocation: {
    height: 12,
    width: '40%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonImage: {
    height: 200,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonText: {
    height: 16,
    width: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonButton: {
    height: 32,
    width: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
});
