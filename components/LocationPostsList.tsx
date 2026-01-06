import React, { memo, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import { getRelativeTime } from '@/utils/timeUtils';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { palette } from '@/constants/Colors';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

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
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['45%', '90%'], []);

  const renderItem = ({ item }: { item: any }) => (
    <PostCard
      item={item}
      onPress={() => {
        router.push(`/(app)/post-details/${item.id}`);
        // Consider if we should close or keep open, but typically nav away closes it
      }}
    />
  );

  if (!posts || posts.length === 0) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Posts at this location ({posts.length})
          </ThemedText>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.close()} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>×</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <FlashList
            data={posts}
            renderItem={renderItem}
            estimatedItemSize={88}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyExtractor={(item, index) => item.id || index.toString()}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: palette.white,
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
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
  },
  listContent: {
    paddingBottom: 20,
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
    color: palette.carbon,
  },
});

export default LocationPostsList;
