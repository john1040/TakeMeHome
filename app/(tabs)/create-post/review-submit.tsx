import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co';

export default function ReviewSubmit() {
  const { images, description, latitude, longitude, streetName } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();

  const parsedImages = JSON.parse(images as string);

  const handleSubmit = async () => {
    if (!session?.user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

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

          return `${supabaseUrl}/storage/v1/object/public/post-images/${imageData.path}`;
        } catch (error) {
          console.error(`Error processing image ${index + 1}:`, error);
          throw error;
        }
      }));

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
            router.replace('/(tabs)/create-post');
            router.replace('/(tabs)');
          }
        }
      ]);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', `Failed to create post. ${error.message}`);
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
      <Button title="Submit" onPress={handleSubmit} />
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
});