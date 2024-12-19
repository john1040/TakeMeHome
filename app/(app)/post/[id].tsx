import { useLocalSearchParams, Stack } from 'expo-router';
import PostDetails from '@/components/PostItem';
import { View } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await supabase
        .from('post')
        .select('*, profiles:user_id(*)')
        .eq('id', id)
        .single();

      if (data) {
        setPost(data);
      }
      setLoading(false);
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return <View><ActivityIndicator /></View>;
  }

  if (!post) {
    return <View><Text>Post not found</Text></View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Post Details' }} />
      <PostItem post={post} />
    </>
  );
} 