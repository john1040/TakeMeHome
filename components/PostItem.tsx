import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  bottomSheetBackground: {
    borderRadius: 24,
    shadowColor: palette.carbon,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  handleIndicator: {
    backgroundColor: `${palette.teal}40`,
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${palette.teal}20`,
  },
  bsCommentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.teal,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    color: palette.carbon,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: `${palette.teal}15`,
    borderRadius: 20,
    padding: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeSegmentAvailable: {
    backgroundColor: palette.teal,
  },
  activeSegmentTaken: {
    backgroundColor: palette.gold,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.deepTeal,
  },
  activeSegmentText: {
    color: palette.white,
  },
  takenContainer: {
    opacity: 0.8,
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
  const images = useMemo(() => post.image?.map(img => img.url) || [], [post.image]);
  const [currentPage, setCurrentPage] = useState(0);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const { userProfile } = useAuth();
  const [availabilityStatus, setAvailabilityStatus] = useState(post.availability_status || 'available');

  // Bottom Sheet
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

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

    const handleSetAvailability = async (targetStatus: string) => {
    if (post.user_id !== userId) return;
    if (availabilityStatus === targetStatus) return;

    try {
      const { error } = await supabase
        .from('post')
        .update({ availability_status: targetStatus })
        .eq('id', post.id)
        .eq('user_id', userId);

      if (error) throw error;

      setAvailabilityStatus(targetStatus);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating availability status:', error);
      Alert.alert("Error", "Failed to update availability status.");
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

  useEffect(() => {
    if (userId) {
      fetchLikeStatus();
    }
  }, [userId, fetchLikeStatus]);

  useEffect(() => {
    setLikeCount(post.likeCount || 0);
  }, [post.likeCount]);

  useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

  // Sync local availability status with prop changes
  useEffect(() => {
    setAvailabilityStatus(post.availability_status || 'available');
  }, [post.availability_status]);

  return (
    <ThemedView variant="surface" style={[styles.container, availabilityStatus === 'taken' && styles.takenContainer]}>
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
      {post.user_id === userId ? (
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            onPress={() => handleSetAvailability('available')}
            style={[
              styles.segment, 
              availabilityStatus === 'available' && styles.activeSegmentAvailable
            ]}
          >
            <ThemedText style={[
              styles.segmentText,
              availabilityStatus === 'available' && styles.activeSegmentText
            ]}>
              Available
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleSetAvailability('taken')}
            style={[
              styles.segment, 
              availabilityStatus === 'taken' && styles.activeSegmentTaken
            ]}
          >
            <ThemedText style={[
              styles.segmentText,
              availabilityStatus === 'taken' && styles.activeSegmentText
            ]}>
              Taken
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
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
        </View>
      )}

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
            <TouchableOpacity onPress={handlePresentModalPress}>
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

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <ThemedText type="subtitle">Comments ({comments.length})</ThemedText>
            <TouchableOpacity onPress={() => bottomSheetModalRef.current?.dismiss()} style={styles.toggleButton}>
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
            <BottomSheetTextInput
              style={styles.bsCommentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={t('posts.addComment')}
              placeholderTextColor={palette.teal}
            />
            <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
              <Send size={24} color={palette.teal} />
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </ThemedView>
  );
};

export default PostItem;
