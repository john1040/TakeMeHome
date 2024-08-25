import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { useAuth } from '@/hooks/useAuth';

const POSTS_PER_PAGE = 3;

export default function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { userProfile } = useAuth();
  const onEndReachedCalledDuringMomentum = useRef(true);

  useEffect(() => {
    if (userProfile?.id) {
      fetchPosts();
    }
  }, [userProfile]);

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
          image:image(url)
        `)
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .range(refresh ? 0 : page * POSTS_PER_PAGE, refresh ? POSTS_PER_PAGE - 1 : (page + 1) * POSTS_PER_PAGE - 1);

      if (error) throw error;

      if (data.length < POSTS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (refresh) {
        setPosts(data);
        setPage(1);
      } else {
        setPosts(prevPosts => [...prevPosts, ...data]);
        setPage(prevPage => prevPage + 1);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, isLoading, hasMore, userProfile]);

  const renderItem = ({ item }) => <PostItem post={item} userId={userProfile?.id} />;

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  const handleLoadMore = () => {
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
    <View style={styles.container}>
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
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 80
  },
  loaderContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
});