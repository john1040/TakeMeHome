import React from 'react';
import { View, Button, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const MAX_IMAGES = 4;

export default function ImageSelection({ selectedImages, setSelectedImages, onNext }) {
  const pickImage = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
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
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {selectedImages.map((uri, index) => (
        <TouchableOpacity key={index} onPress={() => removeImage(index)}>
          <Image source={{ uri }} style={styles.image} />
        </TouchableOpacity>
      ))}
      {selectedImages.length < MAX_IMAGES && (
        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <Text>+</Text>
        </TouchableOpacity>
      )}
      <Button title="Next" onPress={onNext} disabled={selectedImages.length === 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
  },
  addButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    margin: 5,
  },
});