import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Heart } from 'lucide-react-native';

export default function PostItem({ post, userId }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchLikeStatus();
    }
    fetchLikeCount();
  }, [userId]);

  const fetchLikeStatus = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching like status:', error);
    } else {
      setIsLiked(!!data);
    }
  };

  const fetchLikeCount = async () => {
    const { count, error } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('post_id', post.id);

    if (error) {
      console.error('Error fetching like count:', error);
    } else {
      setLikeCount(count || 0);
    }
  };

  const handleLikeUnlike = async () => {
    console.log(userId)
    if (!userId) return;
    console.log("handleLikeUnlike called");

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking post:', error);
      } else {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: userId });

      if (error) {
        console.error('Error liking post:', error);
      } else {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>{post.description}</Text>
      {post.image && post.image[0] && (
        <Image source={{ uri: post.image[0].url }} style={styles.image} />
      )}
      <Text style={styles.location}>{post.street_name}</Text>
      <Text style={styles.date}>{new Date(post.created_at).toLocaleString()}</Text>
      <View style={styles.likeContainer}>
        <TouchableOpacity
          onPress={() => {
            console.log("TouchableOpacity pressed");
            handleLikeUnlike();
          }}
          
          style={styles.touchable}
        >
          <Heart
            size={24}
            color={isLiked ? '#e31b23' : '#000'}
            fill={isLiked ? '#e31b23' : 'none'}
          />
        </TouchableOpacity>
        <Text style={styles.likeCount}>{likeCount} likes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  description: {
    fontSize: 16,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 8,
    fontSize: 14,
  },
  touchable: {
    padding: 10, // Ensure TouchableOpacity has a minimum touchable area
  },
});
