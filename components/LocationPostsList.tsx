import React, { memo, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Dimensions, Animated, PanResponder, TouchableWithoutFeedback } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from '@/hooks/useTranslation';

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
      style={styles.postCard}
      onPress={onPress}
    >
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
              <Text style={styles.categoryText}>
                {t(`categories.${item.category}`)}
              </Text>
            </View>
          )}
          <View style={[
            styles.availabilityBadge,
            item.availability_status === 'taken' ? styles.takenBadge : styles.availableBadge
          ]}>
            <Text style={[
              styles.availabilityText,
              item.availability_status === 'taken' ? styles.takenText : styles.availableText
            ]}>
              {item.availability_status === 'taken' ? 'Taken' : 'Available'}
            </Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const LocationPostsList: React.FC<LocationPostsListProps> = ({ posts, onPostSelect, onClose }) => {
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
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      pan.y.setValue(Math.max(0, gestureState.dy));
      overlayOpacity.setValue(Math.max(0, 1 - gestureState.dy / (height * 0.3)));
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
      onPress={() => onPostSelect(item)}
    />
  );

  if (!posts || posts.length === 0) return null;

  return (
    <TouchableWithoutFeedback onPress={closeSlider}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View
          style={[styles.container, { transform: [{ translateY: slideAnimation }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.title}>Posts at this location ({posts.length})</Text>
                <TouchableOpacity onPress={closeSlider} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.listContainer}>
                <FlashList
                  data={posts}
                  renderItem={renderItem}
                  estimatedItemSize={80}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.listContent}
                />
              </View>
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    padding: 15,
    flex: 1,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 5,
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  postInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availabilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  availableBadge: {
    backgroundColor: '#e8f5e8',
  },
  takenBadge: {
    backgroundColor: '#fff3cd',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  availableText: {
    color: '#28a745',
  },
  takenText: {
    color: '#856404',
  },
});

export default LocationPostsList;
