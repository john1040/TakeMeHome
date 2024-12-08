import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Text, Platform, Image } from 'react-native';
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
          category: post.category,
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
          <Image 
            source={require('@/assets/images/TMH_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image 
          source={require('@/assets/images/TMH_Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 40,
  },
  listContent: {
    paddingHorizontal: 15,
  },
  loaderContainer: {
    paddingVertical: 20,
  },
});
