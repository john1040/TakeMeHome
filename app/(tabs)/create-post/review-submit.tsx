import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as FileSystem from 'expo-file-system';

const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co'; // Make sure this is correct for your setup

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
        const fileInfo = await FileSystem.getInfoAsync(image);
        const base64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
        const arrayBuffer = new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0))).buffer;

        const filename = image.split('/').pop();
        const fileExt = filename?.split('.').pop();
        
        const { data: imageData, error: imageError } = await supabase.storage
          .from('post-images')
          .upload(`${Date.now()}-${index}-${filename}`, arrayBuffer, {
            contentType: `image/${fileExt}`
          });

        if (imageError) throw imageError;
        
        return `${supabaseUrl}/storage/v1/object/public/post-images/${imageData.path}`;
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
            // Navigate back to the main tab view
            
            router.replace('/(tabs)/create-post');
            router.replace('/(tabs)');
            
          }
        }
      ]);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
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