import React, { memo, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, PanResponder, TouchableWithoutFeedback } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import { getRelativeTime } from '@/utils/timeUtils';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { palette } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

interface LocationPostsListProps {
  posts: any[];
  onPostSelect: (post: any) => void;
  onClose: () => void;
}

interface PostCardProps {
  item: any;
  onPress: () => void;
}

const PostCard = memo(({ item, onPress }: PostCardProps) => {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
    >
      <ThemedView variant="surface" style={styles.postCard}>
        <Image
          source={{
            uri: Array.isArray(item.image) ? item.image[0]?.url : item.image?.url,
            cache: 'force-cache',
          }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.postInfo}>
          <View style={styles.badgeContainer}>
            {item.category && (
              <View style={styles.categoryBadge}>
                <ThemedText style={styles.categoryText}>
                  {t(`categories.${item.category}`)}
                </ThemedText>
              </View>
            )}
            <View style={[
              styles.availabilityBadge,
              item.availability_status === 'taken' ? styles.takenBadge : styles.availableBadge
            ]}>
              <ThemedText style={[
                styles.availabilityText,
                item.availability_status === 'taken' ? styles.takenText : styles.availableText
              ]}>
                {item.availability_status === 'taken' ? 'Taken' : 'Available'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.description} numberOfLines={2}>
            {item.description}
          </ThemedText>
          <ThemedText type="caption" style={styles.date}>
            {getRelativeTime(item.created_at, t)}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
});

const LocationPostsList: React.FC<LocationPostsListProps> = ({ posts, onPostSelect, onClose }) => {
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: height * 0.4 })).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (posts && posts.length > 0) {
      Animated.parallel([
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [posts]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to vertical gestures and when gesture starts from near the top
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
    },
    onPanResponderGrant: () => {
      // Grant responder only if the gesture is clearly a swipe down from the header area
      return true;
    },
    onPanResponderMove: (_, gestureState) => {
      // Only allow downward movement
      if (gestureState.dy > 0) {
        pan.y.setValue(gestureState.dy);
        overlayOpacity.setValue(Math.max(0, 1 - gestureState.dy / (height * 0.3)));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        closeSlider();
      } else {
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      }
    },
  });

  const slideAnimation = pan.y.interpolate({
    inputRange: [0, height * 0.4],
    outputRange: [0, height * 0.4],
    extrapolate: 'clamp',
  });

  const closeSlider = () => {
    Animated.parallel([
      Animated.timing(pan.y, {
        toValue: height * 0.4,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(onClose);
  };

  const renderItem = ({ item }: { item: any }) => (
    <PostCard
      item={item}
      onPress={() => {
        router.push(`/(app)/post-details/${item.id}`);
        onClose();
      }}
    />
  );

  if (!posts || posts.length === 0) return null;

  return (
    <TouchableWithoutFeedback onPress={closeSlider}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View
          style={[styles.container, { transform: [{ translateY: slideAnimation }] }]}
        >
          <TouchableWithoutFeedback>
            <ThemedView variant="surface" style={styles.content}>
              <View style={styles.headerSection} {...panResponder.panHandlers}>
                <View style={styles.handle} />
                <View style={styles.header}>
                  <ThemedText type="subtitle" style={styles.title}>Posts at this location ({posts.length})</ThemedText>
                  <TouchableOpacity onPress={closeSlider} style={styles.closeButton}>
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.listContainer}>
                <FlashList
                  data={posts}
                  renderItem={renderItem}
                  estimatedItemSize={80}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.listContent}
                  keyExtractor={(item, index) => item.id || index.toString()}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                />
              </View>
            </ThemedView>
          </TouchableWithoutFeedback>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: 'transparent', // Let ThemedView handle bg
  },
  content: {
    flex: 1,
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // ThemedView 'surface' already has shadows, but we might want to ensure they are correct for a modal
    shadowColor: palette.carbon,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  headerSection: {
    paddingBottom: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: `${palette.teal}40`,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${palette.teal}20`,
    marginBottom: 12,
  },
  title: {
    color: palette.deepTeal,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  closeButtonText: {
    fontSize: 28,
    lineHeight: 28,
    color: palette.teal,
  },
  listContainer: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingVertical: 8,
  },
  postCard: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${palette.teal}20`,
    borderRadius: 16,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: `${palette.teal}10`,
  },
  postInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  description: {
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 20,
  },
  date: {
    color: palette.teal,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: `${palette.teal}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    color: palette.deepTeal,
    fontWeight: '600',
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  availableBadge: {
    backgroundColor: `${palette.sage}20`,
  },
  takenBadge: {
    backgroundColor: `${palette.gold}20`,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availableText: {
    color: palette.forest,
  },
  takenText: {
    color: palette.carbon, // Better contrast on gold
  },
});

export default LocationPostsList;
