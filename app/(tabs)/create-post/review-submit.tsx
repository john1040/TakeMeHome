import React, { useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, Button, Alert, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useQueryClient } from '@tanstack/react-query';

const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co';

export default function ReviewSubmit() {
  const { images, description, latitude, longitude, streetName } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();

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
            
            // Reset the entire navigation state to clear the create post stack
            router.replace('/(tabs)');
            
            // Reset the create post stack after a short delay to ensure proper navigation
            setTimeout(() => {
              router.replace('/(tabs)/create-post');
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
    if (uri.startsWith('file://')) return uri;

    // For asset-library URIs or other types, we'll use ImageManipulator to create a local copy
    const manipulateResult = await ImageManipulator.manipulateAsync(uri, [], { format: 'png' });
    return manipulateResult.uri;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={parsedImages}
        renderItem={({ item }) => <Image source={{ uri: item }} style={styles.image} />}
        keyExtractor={(item, index) => index.toString()}
        horizontal
      />
      <Text style={styles.previewText}>{description}</Text>
      <Text style={styles.previewText}>{streetName}</Text>
      <Button 
        title={isSubmitting ? "Submitting..." : "Submit"} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      />

      <Modal
        transparent={true}
        visible={isSubmitting}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Creating your post...</Text>
            {progress.total > 0 && (
              <Text style={styles.progressText}>
                Uploading images: {progress.current}/{progress.total}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
  },
  previewText: {
    marginVertical: 10,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  progressText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
});