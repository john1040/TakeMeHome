import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, PanResponder, Alert, ActivityIndicator, Share as RNShare, ViewStyle, ImageStyle } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Heart, Send, X, Trash2, MessageCircle, Share as ShareIcon } from 'lucide-react-native';
import PagerView from 'react-native-pager-view';
import { useAuth } from '@/hooks/useAuth';
import { FlashList } from "@shopify/flash-list";
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { palette } from '@/constants/Colors';
import { useTranslation } from '@/hooks/useTranslation';
import { useQueryClient } from '@tanstack/react-query';
import { getRelativeTime } from '@/utils/timeUtils';
import ProfileAvatar from '@/components/ProfileAvatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH / 3;

type StyleProps = ReturnType<typeof createStyles>;

const createStyles = () => StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: palette.carbon,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 16,
  },
  description: {
    marginTop: 15,
    fontSize: 16,
    lineHeight: 24,
  },
  pagerView: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageWrapper: {
    backgroundColor: `${palette.teal}10`,
    borderRadius: 8,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${palette.teal}10`,
    borderRadius: 8,
  },
  errorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  errorText: {
    color: palette.gold,
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
    backgroundColor: `${palette.white}40`,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: palette.white,
  },
  location: {
    color: palette.teal,
  },
  date: {
    marginTop: 8,
    marginBottom: 16,
    color: palette.teal,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 8,
    color: palette.teal,
  },
  touchable: {
    padding: 8,
  },
  commentsSection: {
    marginTop: 16,
  },
  commentsHeader: {
    marginBottom: 12,
    color: palette.deepTeal,
  },
  commentContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: `${palette.teal}10`,
    borderRadius: 8,
  },
  commentContent: {
    fontSize: 14,
    marginVertical: 4,
    color: palette.carbon,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.deepTeal,
  },
  commentDate: {
    fontSize: 12,
    color: palette.teal,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.teal,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: palette.carbon,
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
    backgroundColor: palette.white,
    padding: 16,
    borderRadius: 12,
  },
  fullCommentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${palette.teal}20`,
  },
  closeButton: {
    padding: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  username: {
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: `${palette.teal}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  categoryText: {
    color: palette.teal,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    marginLeft: 16,
    padding: 4,
  },
  shareButton: {
    marginLeft: 16,
    padding: 4,
  },
  viewAllComments: {
    marginTop: 8,
    color: palette.teal,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  availableBadge: {
    backgroundColor: `${palette.teal}10`,
  },
  takenBadge: {
    backgroundColor: `${palette.gold}10`,
  },
  availabilityText: {
    fontWeight: '600',
    fontSize: 12,
  },
  availableText: {
    color: palette.teal,
  },
  takenText: {
    color: palette.gold,
  },
  toggleButton: {
    padding: 4,
  },
});

const styles = createStyles();

interface PaginationDotProps {
  active: boolean;
}

const PaginationDot = ({ active }: PaginationDotProps) => (
  <View
    style={[
      styles.paginationDot,
      active && styles.paginationDotActive,
    ]}
  />
);

interface PaginationDotsProps {
  total: number;
  currentIndex: number;
}

const PaginationDots = ({ total, currentIndex }: PaginationDotsProps) => (
  <View style={styles.paginationContainer}>
    {Array.from({ length: total }).map((_, index) => (
      <PaginationDot key={index} active={index === currentIndex} />
    ))}
  </View>
);

interface ImageWithLoadingProps {
  uri: string;
  style: ViewStyle | ImageStyle;
}

const ImageWithLoading = ({ uri, style }: ImageWithLoadingProps) => {
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
          <ActivityIndicator size="small" color={palette.teal} />
        </View>
      )}
      {error ? (
        <ThemedView variant="surface" style={[style, styles.errorContainer]}>
          <ThemedText type="caption" style={styles.errorText}>Failed to load image</ThemedText>
        </ThemedView>
      ) : (
        <Animated.Image
          source={{ 
            uri,
            cache: 'force-cache',
          }}
          style={[style as ImageStyle, { opacity: fadeAnim }]}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </View>
  );
};

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
}

interface PostItemProps {
  post: {
    id: string;
    description: string;
    created_at: string;
    street_name: string;
    user_id: string;
    category?: string;
    availability_status?: string;
    username: string;
    avatar_url?: string;
    likeCount?: number;
    comments?: Comment[];
    image?: { url: string }[];
  };
  userId: string | null;
  showDelete: boolean;
  onDelete: (postId: string) => void;
  onUpdate?: () => void;
  hideComments?: boolean;
}

const PostItem = ({ post, userId, showDelete, onDelete, onUpdate, hideComments = false }: PostItemProps): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [images, setImages] = useState<string[]>(post.image?.map(img => img.url) || []);
  const [currentPage, setCurrentPage] = useState(0);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const { userProfile } = useAuth();
  const [showFullComments, setShowFullComments] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [availabilityStatus, setAvailabilityStatus] = useState(post.availability_status || 'available');

  const handleAddComment = async () => {
    if (!userId || !newComment.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        post_id: post.id,
        user_id: userId,
        content: newComment.trim(),
        username: userProfile?.username
      }])
      .select();

    if (error) {
      console.error('Error adding comment:', error);
    } else {
      setComments([...comments, data[0]]);
      setNewComment('');
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

  const handleStartChat = () => {
    if (post.user_id === userId) {
      Alert.alert('Info', 'This is your own post');
      return;
    }
    
    router.push({
      pathname: '/(app)/chat',
      params: {
        recipientId: post.user_id,
        recipientUsername: post.username
      }
    });
  };

  const handleShare = async () => {
    try {
      const shareUrl = `tmhapp://post/${post.id}`;
      const webShareUrl = `https://yourapp.com/post/${post.id}`;
      
      await RNShare.share({
        message: `Check out this post: ${post.description}\n${webShareUrl}`,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleToggleAvailability = async () => {
    if (post.user_id !== userId) {
      console.error('Unauthorized availability toggle attempt');
      return;
    }

    const newStatus = availabilityStatus === 'available' ? 'taken' : 'available';
    
    try {
      const { error } = await supabase
        .from('post')
        .update({ availability_status: newStatus })
        .eq('id', post.id)
        .eq('user_id', userId);

      if (error) throw error;

      setAvailabilityStatus(newStatus);
      
      // Invalidate React Query cache to ensure all screens refresh
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      onUpdate?.(); // Call the update callback to refresh the parent component
      
    } catch (error) {
      console.error('Error updating availability status:', error);
      Alert.alert("Error", "Failed to update availability status. Please try again.");
    }
  };

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
                .eq('user_id', userId);

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

  const handleCloseComments = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowFullComments(false));
  };

  const handleShowAllComments = () => {
    setShowFullComments(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <ThemedText type="defaultSemiBold" style={styles.commentUsername}>
        {item.username}
      </ThemedText>
      <ThemedText style={styles.commentContent}>
        {item.content}
      </ThemedText>
      <ThemedText type="caption" style={styles.commentDate}>
        {getRelativeTime(item.created_at, t)}
      </ThemedText>
    </View>
  );

  const onPageSelected = (e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  };

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

  const fetchLikeStatus = useCallback(async () => {
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
  }, [userId, post.id]);

  const fetchLikeCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('post_id', post.id);

    if (error) {
      console.error('Error fetching like count:', error);
    } else {
      setLikeCount(count || 0);
    }
  }, [post.id]);

  const fetchImages = useCallback(async () => {
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
  }, [post.id]);

  const fetchComments = useCallback(async () => {
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
  }, [post.id]);

  useEffect(() => {
    if (userId) {
      fetchLikeStatus();
    }
    fetchLikeCount();
    fetchImages();
    fetchComments();
  }, [userId, fetchLikeStatus, fetchLikeCount, fetchImages, fetchComments]);

  // Sync local availability status with prop changes
  useEffect(() => {
    setAvailabilityStatus(post.availability_status || 'available');
  }, [post.availability_status]);

  return (
    <ThemedView variant="surface" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfoContainer}>
          <ProfileAvatar
            avatarUrl={post.avatar_url}
            size={40}
            iconSize={20}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <ThemedText type="subtitle" style={styles.username}>{post.username}</ThemedText>
            <ThemedText type="caption" style={styles.location}>{post.street_name}</ThemedText>
          </View>
        </View>
        {post.category && (
          <ThemedView style={styles.categoryBadge}>
            <ThemedText type="caption" style={styles.categoryText}>
              {t(`categories.${post.category}`)}
            </ThemedText>
          </ThemedView>
        )}
      </View>

      

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

      <ThemedText style={styles.description}>
        {post.description}
      </ThemedText>

      <ThemedText type="caption" style={styles.date}>
        {getRelativeTime(post.created_at, t)}
      </ThemedText>

      {/* Availability Status */}
      <View style={styles.availabilityContainer}>
        <View style={[
          styles.availabilityBadge,
          availabilityStatus === 'available' ? styles.availableBadge : styles.takenBadge
        ]}>
          <ThemedText style={[
            styles.availabilityText,
            availabilityStatus === 'available' ? styles.availableText : styles.takenText
          ]}>
            {availabilityStatus === 'available' ? 'Available' : 'Taken'}
          </ThemedText>
        </View>
        {post.user_id === userId && showDelete && (
          <TouchableOpacity onPress={handleToggleAvailability} style={styles.toggleButton}>
            <ThemedText style={[
              styles.availabilityText,
              availabilityStatus === 'available' ? styles.takenText : styles.availableText
            ]}>
              Mark as {availabilityStatus === 'available' ? 'Taken' : 'Available'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionContainer}>
        <View style={styles.actionButtons}>
          <View style={styles.likeContainer}>
            <TouchableOpacity
              onPress={handleLikeUnlike}
              style={styles.touchable}
            >
              <Heart
                size={24}
                color={isLiked ? palette.gold : palette.teal}
                fill={isLiked ? palette.gold : 'none'}
              />
            </TouchableOpacity>
            <ThemedText style={styles.likeCount}>
              {likeCount} {likeCount === 1 ? t('posts.like') : t('posts.likes')}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={handleStartChat} style={styles.chatButton}>
            <MessageCircle size={24} color={palette.teal} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <ShareIcon size={24} color={palette.teal} />
          </TouchableOpacity>
        </View>
        {showDelete && post.user_id === userId && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={24} color={palette.gold} />
          </TouchableOpacity>
        )}
      </View>
      {!hideComments && (
        <View style={styles.commentsSection}>
          <ThemedText type="defaultSemiBold" style={styles.commentsHeader}>
            {t('posts.comments')}
          </ThemedText>
          <View style={{minHeight: 2}}>
            <FlashList
              data={comments.slice(0, 2)}
              renderItem={renderComment}
              keyExtractor={(item, index) => `${post.id}-comment-${item.id}-${index}`}
              estimatedItemSize={5}
            />
          </View>
          {comments.length > 2 && (
            <TouchableOpacity onPress={handleShowAllComments}>
              <ThemedText type="link" style={styles.viewAllComments}>
                {t('posts.viewAllComments', { count: comments.length })}
              </ThemedText>
            </TouchableOpacity>
          )}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={t('posts.addComment')}
              placeholderTextColor={palette.teal}
            />
            <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
              <Send size={24} color={palette.teal} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showFullComments && (
        <Animated.View
          style={[
            styles.fullCommentsView,
            { transform: [{ translateX: slideAnim }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.fullCommentsHeader}>
            <ThemedText type="heading">Comments</ThemedText>
            <TouchableOpacity onPress={handleCloseComments} style={styles.closeButton}>
              <X size={24} color={palette.teal} />
            </TouchableOpacity>
          </View>
          <FlashList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item, index) => `${post.id}-fullcomment-${item.id}-${index}`}
            estimatedItemSize={5}
          />
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={t('posts.addComment')}
              placeholderTextColor={palette.teal}
            />
            <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
              <Send size={24} color={palette.teal} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ThemedView>
  );
};

export default PostItem;
