import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, PanResponder, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Heart, Send, X, Trash2 } from 'lucide-react-native';
import PagerView from 'react-native-pager-view';
import { useAuth } from '@/hooks/useAuth';
import { FlashList } from "@shopify/flash-list";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH / 3;

const PaginationDot = ({ active }) => (
  <View
    style={[
      styles.paginationDot,
      active && styles.paginationDotActive,
    ]}
  />
);

const PaginationDots = ({ total, currentIndex }) => (
  <View style={styles.paginationContainer}>
    {Array.from({ length: total }).map((_, index) => (
      <PaginationDot key={index} active={index === currentIndex} />
    ))}
  </View>
);

const ImageWithLoading = ({ uri, style }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  return (
    <View style={[style, styles.imageWrapper]}>
      {loading && (
        <View style={[style, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      {error ? (
        <View style={[style, styles.errorContainer]}>
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      ) : (
        <Animated.Image
          source={{ 
            uri,
            cache: 'force-cache',
            priority: 'high',
          }}
          style={[style, { opacity: fadeAnim }]}
          onLoad={onLoad}
          onError={onError}
          loading="eager"
        />
      )}
    </View>
  );
};

export default function PostItem({ post, userId, showDelete, onDelete }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const { userProfile, isLoading } = useAuth();
  const [showFullComments, setShowFullComments] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          handleCloseComments();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  const onPageSelected = (e) => {
    setCurrentPage(e.nativeEvent.position);
  };

  useEffect(() => {
    if (userId) {
      fetchLikeStatus();
    }
    fetchLikeCount();
    fetchImages();
    fetchComments();
  }, [userId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, username')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data);
    }
  };

  const handleAddComment = async () => {
    if (!userId || !newComment.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: post.id, user_id: userId, content: newComment.trim(), username: userProfile?.username }])
      .select();

    if (error) {
      console.error('Error adding comment:', error);
    } else {
      setComments([...comments, data[0]]);
      setNewComment('');
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
      setImages(data.map((img) => img.url));
    }
  };

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
        setLikeCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert([{ post_id: post.id, user_id: userId }]);

      if (error) {
        console.error('Error liking post:', error);
      } else {
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    }
  };


  const handleShowAllComments = () => {
    setShowFullComments(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseComments = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowFullComments(false));
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentUsername}>{item.username}</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentDate}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  const handleDelete = () => {
    if (post.user_id !== userId) {
      console.error('Unauthorized delete attempt');
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('post')
                .delete()
                .eq('id', post.id)
                .eq('user_id', userId);  // Ensure the post belongs to the current user

              if (error) throw error;

              onDelete(post.id);
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert("Error", "Failed to delete post. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{post.profiles?.username}</Text>
          <Text style={styles.location}>{post.street_name}</Text>
        </View>
        {post.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.description}>{post.description}</Text>
      {images.length > 0 && (
        <View>
          <PagerView
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={onPageSelected}
          >
            {images.map((imageUrl, index) => (
              <View key={index} style={styles.imageContainer}>
                <ImageWithLoading
                  uri={imageUrl}
                  style={styles.image}
                />
              </View>
            ))}
          </PagerView>
          {images.length > 1 && (
            <PaginationDots total={images.length} currentIndex={currentPage} />
          )}
        </View>
      )}
      <Text style={styles.date}>{new Date(post.created_at).toLocaleString()}</Text>
      <View style={styles.actionContainer}>
        <View style={styles.likeContainer}>
          <TouchableOpacity
            onPress={handleLikeUnlike}
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
        {showDelete && post.user_id === userId && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={24} color="#e31b23" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.commentsSection}>
        <Text style={styles.commentsHeader}>Comments</Text>
        <View style={{minHeight: 2}}>
          <FlashList
            data={comments.slice(0, 2)}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            estimatedItemSize={5}
          />
        </View>
        {comments.length > 2 && (
          <TouchableOpacity onPress={handleShowAllComments}>
            <Text>View all {comments.length} comments</Text>
          </TouchableOpacity>
        )}
        <View style={styles.addCommentContainer}>
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
          />
          <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
            <Send size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      {showFullComments && (
        <Animated.View 
          style={[
            styles.fullCommentsView, 
            { transform: [{ translateX: slideAnim }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.fullCommentsHeader}>
            <Text style={styles.fullCommentsTitle}>Comments</Text>
            <TouchableOpacity onPress={handleCloseComments}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <FlashList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            estimatedItemSize={5}
          />
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
            />
            <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
              <Send size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 8,
  },
  pagerView: {
    width: '100%',
    height: 300,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageWrapper: {
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    color: '#666',
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'white',
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
  commentsSection: {
    marginTop: 16,
  },
  commentsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentsList: {
    maxHeight: 200,
  },
  commentContainer: {
    marginBottom: 8,
  },
  commentContent: {
    fontSize: 14,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
  fullCommentsView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    padding: 16,
    borderRadius:8
  },
  fullCommentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fullCommentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
