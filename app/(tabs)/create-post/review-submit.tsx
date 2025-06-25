import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Modal, Dimensions, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useQueryClient } from '@tanstack/react-query';
import PagerView from 'react-native-pager-view';
import ThemedButton from '@/components/ThemeButton';
import { ThemedText } from '@/components/ThemedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co';

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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const onLoad = React.useCallback(() => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onError = React.useCallback(() => {
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
          source={{ uri }}
          style={[style, { opacity: fadeAnim }]}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </View>
  );
};

export default function ReviewSubmit() {
  const { images, description, latitude, longitude, streetName, category } = useLocalSearchParams();
  const { session, userProfile } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);

  const parsedImages = JSON.parse(images as string);

  const handleSubmit = async () => {
    if (!session?.user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    setIsSubmitting(true);
    setProgress({ current: 0, total: parsedImages.length });

    try {
      console.log('Starting image upload process...');
      const uploadedImages = await Promise.all(parsedImages.map(async (image, index) => {
        try {
          console.log(`Processing image ${index + 1}:`, image);
          
          // Convert the image to a local file URI if it's not already
          const localUri = image.startsWith('file://') ? image : await convertToLocalUri(image);
          
          console.log('Local URI:', localUri);
          
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          console.log('File info:', fileInfo);
          
          if (!fileInfo.exists) {
            throw new Error(`File does not exist: ${localUri}`);
          }
          
          const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
          const arrayBuffer = new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0))).buffer;

          const filename = localUri.split('/').pop();
          const fileExt = filename?.split('.').pop();

          const { data: imageData, error: imageError } = await supabase.storage
            .from('post-images')
            .upload(`${Date.now()}-${index}-${filename}`, arrayBuffer, {
              contentType: `image/${fileExt}`
            });

          if (imageError) throw imageError;

          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
          return `${supabaseUrl}/storage/v1/object/public/post-images/${imageData.path}`;
        } catch (error) {
          console.error(`Error processing image ${index + 1}:`, error);
          throw error;
        }
      }));

      setProgress(prev => ({ ...prev, current: prev.total }));

      const { data, error } = await supabase
        .from('post')
        .insert({
          user_id: session.user.id,
          description: description,
          geolocation: `POINT(${longitude} ${latitude})`,
          street_name: streetName,
          category: category,
          availability_status: 'available',
        })
        .select();
        
      if (error) throw error;

      await Promise.all(uploadedImages.map(async (url, index) => {
        const { error: imageInsertError } = await supabase
          .from('image')
          .insert({
            post_id: data[0].id,
            url: url,
            order: index,
          });

        if (imageInsertError) throw imageInsertError;
      }));

      Alert.alert('Success', 'Post created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Invalidate and refetch posts query
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            
            // Reset to the root tab navigator first
            router.replace('/(tabs)');
            
            // Then reset the create post stack to its initial state
            setTimeout(() => {
              router.replace('/(tabs)/create-post/image-selection');
            }, 100);
          }
        }
      ]);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', `Failed to create post. ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const convertToLocalUri = async (uri: string): Promise<string> => {
    // If it's already a file URI, return it
    if (uri.startsWith('file://')) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // Check file size (5MB limit)
      if (fileInfo.size > 5 * 1024 * 1024) {
        throw new Error('Image size exceeds 5MB limit. Please choose a smaller image.');
      }
    }

    // For asset-library URIs or other types, we'll use ImageManipulator to create a local copy
    const manipulateResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], // Resize to max width of 1080px while maintaining aspect ratio
      { 
        compress: 0.8, // 80% quality
        format: 'jpeg'
      }
    );

    // Verify the compressed size
    const compressedFileInfo = await FileSystem.getInfoAsync(manipulateResult.uri);
    if (compressedFileInfo.size > 5 * 1024 * 1024) {
      // If still too large, compress further
      const furtherCompressedResult = await ImageManipulator.manipulateAsync(
        manipulateResult.uri,
        [],
        { 
          compress: 0.5, // 50% quality
          format: 'jpeg'
        }
      );
      return furtherCompressedResult.uri;
    }

    return manipulateResult.uri;
  };

  const onPageSelected = (e) => {
    setCurrentPage(e.nativeEvent.position);
  };

  return (
    <View style={styles.container}>
      <View style={styles.postContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.username}>{userProfile?.username}</ThemedText>
          <ThemedText style={styles.location}>{streetName}</ThemedText>
        </View>

        {/* Images */}
        <View style={styles.imageContainer}>
          <PagerView
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={onPageSelected}
          >
            {parsedImages.map((image, index) => (
              <View key={index} style={styles.imagePage}>
                <ImageWithLoading
                  uri={image}
                  style={styles.image}
                />
              </View>
            ))}
          </PagerView>
          {parsedImages.length > 1 && (
            <PaginationDots
              total={parsedImages.length}
              currentIndex={currentPage}
            />
          )}
        </View>

        {/* Description */}
        <View style={styles.contentContainer}>
          <ThemedText style={styles.description}>{description}</ThemedText>
        </View>
      </View>

      {/* Submit Button */}
      <ThemedButton
        type="primary"
        size="large"
        title={isSubmitting ? "Posting..." : "Share Post"}
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitButton}
      />

      {/* Upload Progress Modal */}
      <Modal
        transparent={true}
        visible={isSubmitting}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.modalText}>
              Uploading images ({progress.current}/{progress.total})
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  postContainer: {
    backgroundColor: 'white',
    marginBottom: 10,
    width: '100%',
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  imageContainer: {
    width: '100%',
    height: SCREEN_WIDTH,
    backgroundColor: '#f0f0f0',
  },
  pagerView: {
    width: '100%',
    height: '100%',
  },
  imagePage: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    color: '#666',
  },
  contentContainer: {
    padding: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  submitButton: {
    margin: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    marginTop: 10,
    fontSize: 16,
  },
});