import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import ThemedButton from '@/components/ThemeButton';
import { Alert } from 'react-native';

const PostImage = React.memo(({ uri }: { uri: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.postImageContainer}>
      <Image
        source={{ uri }}
        style={styles.postImage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      )}
      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="gray" />
        </View>
      )}
    </View>
  );
});

export default function TabTwoScreen() {
  const { userProfile } = useAuth();
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
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <ThemedText type="title">我的帳號 {userProfile?.username}</ThemedText>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.postsContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});