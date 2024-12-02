import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Text, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

const POSTS_PER_PAGE = 3;

export default function PostFeed() {
  const [userId, setUserId] = useState(null);
  const onEndReachedCalledDuringMomentum = useRef(true);

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
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('post')
        .select(`
          id,
          description,
          created_at,
          street_name,
          user_id,
          image:image(url),
          profiles:profiles!post_user_id_fkey(username)
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (error) throw error;

      return {
        posts: data.map(post => ({
          ...post,
          username: post.profiles.username
        })),
        nextPage: data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!userId,
  });

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  const renderItem = ({ item }) => <PostItem post={item} userId={userId} />;

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  const handleLoadMore = () => {
    if (!onEndReachedCalledDuringMomentum.current && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      onEndReachedCalledDuringMomentum.current = true;
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TakeMeHome</Text>
        </View>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TakeMeHome</Text>
      </View>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onMomentumScrollBegin={() => { onEndReachedCalledDuringMomentum.current = false }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  loaderContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
});
