import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MessageCircle } from 'lucide-react-native';

const POSTS_PER_PAGE = 3;

export default function PostFeed() {
  const [userId, setUserId] = useState(null);
  const onEndReachedCalledDuringMomentum = useRef(true);
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    // Set the header right button
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => router.push('/(app)/chats')}
          style={styles.chatButton}
        >
          <MessageCircle size={24} color="#000" />
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
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onMomentumScrollBegin={() => { onEndReachedCalledDuringMomentum.current = false; }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    marginRight: 16,
    padding: 4,
  },
});
