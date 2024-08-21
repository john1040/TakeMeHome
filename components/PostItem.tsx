import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Heart, Send } from 'lucide-react-native';
import PagerView from 'react-native-pager-view';
import { useAuth } from '@/hooks/useAuth';
import { FlashList } from "@shopify/flash-list";

export default function PostItem({ post, userId }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const { userProfile, isLoading } = useAuth();

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

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentUsername}>{item.username}</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentDate}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  const handleShowAllComments = () => {
    setShowAllComments(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>{post.description}</Text>
      {images.length > 0 && (
        <PagerView
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={onPageSelected}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.page}>
              <Image source={{ uri }} style={styles.image} />
            </View>
          ))}
        </PagerView>
      )}
      <View style={styles.pagination}>
        {images.length > 1 && images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentPage === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.location}>{post.street_name}</Text>
      <Text style={styles.date}>{new Date(post.created_at).toLocaleString()}</Text>
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
      <View style={styles.commentsSection}>
        <Text style={styles.commentsHeader}>Comments</Text>
        <View style={{minHeight: 2}}>
          <FlashList
            data={showAllComments ? comments : comments.slice(0, 2)}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            estimatedItemSize={5}
          />
        </View>
        {!showAllComments && comments.length > 2 && (
          <TouchableOpacity onPress={handleShowAllComments} >
            <Text >View all {comments.length} comments</Text>
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
  pagerView: {
    width: '100%',
    height: 200,
    marginBottom: 8,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
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
});
