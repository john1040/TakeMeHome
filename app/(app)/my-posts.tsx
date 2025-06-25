import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, SectionList } from 'react-native';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { palette } from '@/constants/Colors';
import { CheckCircle, Clock } from 'lucide-react-native';

const POSTS_PER_PAGE = 3;

interface Post {
  id: string;
  description: string;
  created_at: string;
  street_name: string;
  user_id: string;
  availability_status: string;
  image?: { url: string }[];
}

interface Section {
  title: string;
  data: Post[];
  key: string;
}

export default function MyPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (userProfile?.id) {
      fetchPosts();
    }
  }, [userProfile]);

  const fetchPosts = useCallback(async () => {
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
          availability_status,
          image:image(url)
        `)
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userProfile]);

  const handleDeletePost = useCallback(async (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);

  const handlePostUpdate = useCallback(() => {
    // Force refresh when a post availability is updated
    fetchPosts();
  }, [fetchPosts]);

  // Organize posts into sections
  const sections: Section[] = [
    {
      title: 'Available',
      data: posts.filter(post => post.availability_status === 'available'),
      key: 'available'
    },
    {
      title: 'Taken',
      data: posts.filter(post => post.availability_status === 'taken'),
      key: 'taken'
    }
  ].filter(section => section.data.length > 0); // Only show sections with posts

  const renderItem = ({ item }: { item: Post }) => (
    <PostItem
      post={item}
      userId={userProfile?.id}
      showDelete={true}
      onDelete={handleDeletePost}
      onUpdate={fetchPosts}
    />
  );

  const renderSectionHeader = ({ section }: { section: Section }) => {
    const isAvailable = section.key === 'available';
    const icon = isAvailable ? CheckCircle : Clock;
    const iconColor = isAvailable ? palette.teal : palette.gold;
    
    return (
      <ThemedView style={[
        styles.sectionHeader,
        isAvailable ? styles.availableSectionHeader : styles.takenSectionHeader
      ]} variant="surface">
        <View style={styles.sectionHeaderContent}>
          {React.createElement(icon, {
            size: 20,
            color: iconColor,
            style: styles.sectionIcon
          })}
          <ThemedText type="subtitle" style={[
            styles.sectionTitle,
            isAvailable ? styles.availableSectionTitle : styles.takenSectionTitle
          ]}>
            {section.title}
          </ThemedText>
          <ThemedView style={[
            styles.countBadge,
            isAvailable ? styles.availableCountBadge : styles.takenCountBadge
          ]}>
            <ThemedText style={[
              styles.countText,
              isAvailable ? styles.availableCountText : styles.takenCountText
            ]}>
              {section.data.length}
            </ThemedText>
          </ThemedView>
        </View>
      </ThemedView>
    );
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  if (isLoading && posts.length === 0) {
    return (
      <ThemedView style={styles.loaderContainer} variant="surface">
        <ActivityIndicator size="large" color={palette.teal} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} variant="surface">
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={palette.teal}
          />
        }
        ListEmptyComponent={() => (
          <ThemedView style={styles.emptyContainer} variant="surface">
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No Posts Yet
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              Create your first post to share furniture with your community!
            </ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowColor: palette.carbon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableSectionHeader: {
    backgroundColor: `${palette.teal}15`,
    borderLeftWidth: 4,
    borderLeftColor: palette.teal,
  },
  takenSectionHeader: {
    backgroundColor: `${palette.gold}15`,
    borderLeftWidth: 4,
    borderLeftColor: palette.gold,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontWeight: '700',
    fontSize: 18,
  },
  availableSectionTitle: {
    color: palette.deepTeal,
  },
  takenSectionTitle: {
    color: palette.gold,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  availableCountBadge: {
    backgroundColor: palette.teal,
  },
  takenCountBadge: {
    backgroundColor: palette.gold,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
  },
  availableCountText: {
    color: palette.white,
  },
  takenCountText: {
    color: palette.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    color: palette.teal,
    marginBottom: 8,
  },
  emptyText: {
    color: palette.carbon,
    textAlign: 'center',
  },
});