import React, { memo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { FlashList } from "@shopify/flash-list";

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = height * 0.4;

interface LocationPostsListProps {
  posts: any[];
  onPostSelect: (post: any) => void;
  onClose: () => void;
}

const PostCard = memo(({ item, onPress }) => (
  <TouchableOpacity 
    style={styles.postCard}
    onPress={onPress}
  >
    <Image 
      source={{ 
        uri: Array.isArray(item.image) ? item.image[0]?.url : item.image?.url,
        cache: 'force-cache',
        priority: 'high',
      }}
      style={styles.thumbnail}
      resizeMode="cover"
      loading="eager"
    />
    <View style={styles.postInfo}>
      {item.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        </View>
      )}
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  </TouchableOpacity>
));

const LocationPostsList: React.FC<LocationPostsListProps> = ({ posts, onPostSelect, onClose }) => {
  const renderItem = ({ item }) => (
    <PostCard 
      item={item} 
      onPress={() => onPostSelect(item)}
    />
  );

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Posts at this location ({posts.length})</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={3}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: '15%',
    left: (width - CARD_WIDTH) / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    padding: 10,
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
});

export default LocationPostsList;
