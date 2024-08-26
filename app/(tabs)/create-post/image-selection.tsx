import React, { useState } from 'react';
import { View, Button, Image, FlatList, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import ThemedButton from '@/components/ThemeButton';
import { AntDesign } from '@expo/vector-icons';

const MAX_IMAGES = 4;

export default function ImageSelection() {
  const [images, setImages] = useState([]);
  const router = useRouter();

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Maximum images reached', `You can only select up to ${MAX_IMAGES} images.`);
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (images.length === 0) {
      Alert.alert('No images selected', 'Please select at least one image to continue.');
      return;
    }
    router.push({
      pathname: '/create-post/description-location',
      params: { images: JSON.stringify(images) }
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => removeImage(index)}>
            <Image source={{ uri: item }} style={styles.image} />
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
      />
      {images.length < MAX_IMAGES && (
        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}

      {/* <ThemedButton
        onPress={handleNext}
        type="default"
        size="large"
        style={styles.nextButton}
        disabled={images.length === 0}
      >
        <AntDesign name="arrowright" size={24} color="black" />
      </ThemedButton> */}
      <ThemedButton
        onPress={handleNext}
        type="default"
        size="large"
        style={styles.nextButton}
        disabled={images.length === 0}
      >
        <View style={styles.nextButtonContent}>
          <AntDesign name="arrowright" size={24} color="black" />
        </View>
      </ThemedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    margin: 5,
  },
  addButton: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    margin: 5,
  },
  addButtonText: {
    fontSize: 40,
    color: '#888',
  },
  nextButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,  // Increased from 60
    height: 64,  // Increased from 60
    borderRadius: 32,  // Half of width/height
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,  // Remove default padding
  },
  nextButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});