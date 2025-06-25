import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
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

const POSTS_PER_PAGE = 3;

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

  // Query for user ID
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
  });

  // Query for posts with infinite loading
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
      const { data, error } = await supabase
        .from('post')
        .select(`
          id,
          description,
          created_at,
          street_name,
          user_id,
          category,
          availability_status,
          image:image(url),
          profiles:profiles!post_user_id_fkey(username)
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (error) throw error;

      const posts = (data as RawPost[]).map(post => ({
        ...post,
        username: post.profiles[0]?.username || 'Unknown User',
      }));

      return {
        posts,
        nextPage: data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!userId,
  });

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  const renderItem = useCallback(({ item }: { item: Post }) => (
    <PostItem
      post={item}
      userId={userId}
      showDelete={false}
      onDelete={() => refetch()}
    />
  ), [userId]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <ThemedView style={styles.loaderContainer} variant="surface">
        <ActivityIndicator size="large" color={palette.teal} />
      </ThemedView>
    );
  };

  const handleLoadMore = () => {
    if (!onEndReachedCalledDuringMomentum.current && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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

  if (isLoading) {
    return (
      <ThemedView style={styles.loaderContainer} variant="surface">
        <ActivityIndicator size="large" color={palette.teal} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} variant="surface">
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
});
