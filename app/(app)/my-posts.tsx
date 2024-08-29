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
  const [hasMore, setHasMore] = useState(true);
  const { userProfile } = useAuth();
  const onEndReachedCalledDuringMomentum = useRef(true);

  useEffect(() => {
    if (userProfile?.id) {
      fetchPosts(true);
    }
  }, [userProfile]);

  const fetchPosts = useCallback(async (refresh = false, extraPosts = 0) => {
    if (isLoading || (!hasMore && !refresh)) return;
    setIsLoading(true);

    try {
      const fetchCount = refresh ? POSTS_PER_PAGE : POSTS_PER_PAGE + extraPosts;
      const startRange = refresh ? 0 : posts.length;
      const endRange = startRange + fetchCount - 1;

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
        .range(startRange, endRange);

      if (error) throw error;

      if (data.length < fetchCount) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (refresh) {
        setPosts(data);
      } else {
        setPosts(prevPosts => [...prevPosts, ...data]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [posts.length, isLoading, hasMore, userProfile]);

  const handleDeletePost = useCallback(async (postId) => {
    setPosts(prevPosts => {
      const newPosts = prevPosts.filter(post => post.id !== postId);
      const deletedCount = prevPosts.length - newPosts.length;
      
      if (deletedCount > 0 && newPosts.length < POSTS_PER_PAGE && hasMore) {
        // Fetch more posts to replace the deleted ones
        fetchPosts(false, deletedCount);
      }
      
      return newPosts;
    });
  }, [fetchPosts, hasMore]);

  const renderItem = ({ item }) => (
    <PostItem
      post={item}
      userId={userProfile?.id}
      showDelete={true}
      onDelete={handleDeletePost}
    />
  );

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  const handleLoadMore = () => {
    if (!onEndReachedCalledDuringMomentum.current && hasMore) {
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