import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';

const POSTS_PER_PAGE = 3;

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isUserIdLoading, setIsUserIdLoading] = useState(true);
  const onEndReachedCalledDuringMomentum = useRef(true);

  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPosts();
    }
  }, [userId]);

  const fetchUserId = async () => {
    setIsUserIdLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
    setIsUserIdLoading(false);
  };

  const fetchPosts = useCallback(async (refresh = false) => {
    if (isLoading || (!hasMore && !refresh)) return;
    setIsLoading(true);

    try {
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
        .range(refresh ? 0 : page * POSTS_PER_PAGE, refresh ? POSTS_PER_PAGE - 1 : (page + 1) * POSTS_PER_PAGE - 1);

      if (error) throw error;
      console.log(data[0])
      if (data.length < POSTS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      const postsWithUsername = data.map(post => ({
        ...post,
        username: post.profiles.username
      }));

      if (refresh) {
        setPosts(postsWithUsername);
        setPage(1);
      } else {
        setPosts(prevPosts => [...prevPosts, ...postsWithUsername]);
        setPage(prevPage => prevPage + 1);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, isLoading, hasMore]);

  const renderItem = ({ item }) => <PostItem post={item} userId={userId} />;

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  const handleLoadMore = () => {
    console.log('handling load more')
    if (!onEndReachedCalledDuringMomentum.current) {
      fetchPosts();
      onEndReachedCalledDuringMomentum.current = true;
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPosts(true);
  }, [fetchPosts]);

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={item => item.id.toString()}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      onMomentumScrollBegin={() => {
        onEndReachedCalledDuringMomentum.current = false;
      }}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 70,
    paddingHorizontal: 10,
    paddingBottom: 80
  },
  loaderContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
});
