import React, { useState, useEffect } from 'react';
import { View, Image, FlatList, TouchableOpacity, StyleSheet, Text, SafeAreaView, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useRouter, useFocusEffect } from 'expo-router';
import ThemedButton from '@/components/ThemeButton';
import { AntDesign } from '@expo/vector-icons';

const MAX_IMAGES = 4;

export default function CustomImagePicker() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const router = useRouter();

  // Reset selected photos when the component mounts or comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setSelectedPhotos([]);
      return () => {};
    }, [])
  );

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const { assets } = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: 'photo'
        });
        setPhotos(assets);
      }
    })();
  }, []);

  const toggleSelection = (photo) => {
    setSelectedPhotos((prev) => {
      const index = prev.findIndex(p => p.id === photo.id);
      if (index > -1) {
        // Deselect
        const newSelection = prev.filter(p => p.id !== photo.id);
        return newSelection.map((p, i) => ({ ...p, order: i + 1 }));
      } else if (prev.length < MAX_IMAGES) {
        // Select
        return [...prev, { ...photo, order: prev.length + 1 }];
      }
      return prev;
    });
  };

  const handleNext = () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No images selected', 'Please select at least one image to continue.');
      return;
    }
    router.push({
      pathname: '/create-post/description-location',
      params: { images: JSON.stringify(selectedPhotos.map(img => img.uri)) }
    });
  };

  const renderPhoto = ({ item }) => {
    const isSelected = selectedPhotos.some(p => p.id === item.id);
    const selectedIndex = selectedPhotos.findIndex(p => p.id === item.id);

    return (
      <TouchableOpacity onPress={() => toggleSelection(item)} style={styles.photoContainer}>
        <Image source={{ uri: item.uri }} style={styles.photo} />
        {isSelected && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionText}>{selectedIndex + 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
      />
      <ThemedButton
        onPress={handleNext}
        type="default"
        size="large"
        style={styles.nextButton}
        disabled={selectedPhotos.length === 0}
      >
        <View style={styles.nextButtonContent}>
          <AntDesign name="arrowright" size={24} color="black" />
        </View>
      </ThemedButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  photoContainer: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 1,
  },
  photo: {
    flex: 1,
  },
  selectionBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  nextButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});