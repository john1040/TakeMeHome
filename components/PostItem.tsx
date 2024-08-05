import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Heart } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PostItem({ post, userId }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  console.log('images', images)
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (userId) {
      fetchLikeStatus();
    }
    fetchLikeCount();
    fetchImages();
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

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('image')
      .select('url')
      .eq('post_id', post.id)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching images:', error);
    } else {
      setImages(data.map(img => img.url));
    }
  };

  const handleLikeUnlike = async () => {
    if (!userId) return;

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

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
    },
    onEnd: (event) => {
      const threshold = SCREEN_WIDTH / 4;
      if (Math.abs(event.velocityX) > 500 || Math.abs(event.translationX) > threshold) {
        if (event.velocityX > 0 && currentIndex > 0) {
          translateX.value = withSpring((currentIndex - 1) * -SCREEN_WIDTH);
          runOnJS(setCurrentIndex)(currentIndex - 1);
        } else if (event.velocityX < 0 && currentIndex < images.length - 1) {
          translateX.value = withSpring((currentIndex + 1) * -SCREEN_WIDTH);
          runOnJS(setCurrentIndex)(currentIndex + 1);
        } else {
          translateX.value = withSpring(currentIndex * -SCREEN_WIDTH);
        }
      } else {
        translateX.value = withSpring(currentIndex * -SCREEN_WIDTH);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          {images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </Animated.View>
      </PanGestureHandler>
      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
      <Text style={styles.description}>{post.description}</Text>
      <Text style={styles.location}>{post.street_name}</Text>
      <Text style={styles.date}>{new Date(post.created_at).toLocaleString()}</Text>
      <View style={styles.likeContainer}>
        <TouchableOpacity onPress={handleLikeUnlike} style={styles.touchable}>
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
  imageContainer: {
    width: SCREEN_WIDTH - 32, // Account for container padding
    height: (SCREEN_WIDTH - 32) * 0.75, // Maintain 4:3 aspect ratio
    flexDirection: 'row',
    overflow: 'hidden',
  },
  image: {
    width: SCREEN_WIDTH - 32,
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#000',
  },
  description: {
    fontSize: 16,
    marginTop: 8,
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
    padding: 10,
  },
});