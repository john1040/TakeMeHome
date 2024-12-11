import React, { useState, useEffect, useRef } from 'react';
import { View, Image, FlatList, TouchableOpacity, StyleSheet, Text, SafeAreaView, Alert, Modal } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType } from 'expo-camera';
import { useRouter, useFocusEffect, router } from 'expo-router';
import ThemedButton from '@/components/ThemeButton';
import { AntDesign, Ionicons } from '@expo/vector-icons';

const MAX_IMAGES = 4;

export default function CustomImagePicker() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const cameraRef = useRef(null);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      // Media Library Permissions
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      // Camera Permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus === 'granted');

      // Fetch Photos
      if (mediaStatus === 'granted') {
        const { assets } = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: 'photo'
        });
        setPhotos(assets);
      }
    })();
  }, []);

  // Reset selected photos when component comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setSelectedPhotos([]);
      return () => {};
    }, [])
  );

  // Toggle photo selection
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

  // Open camera modal
  const openCamera = () => {
    if (cameraPermission) {
      setCameraModalVisible(true);
    } else {
      Alert.alert('Camera Permission', 'Please grant camera permissions in settings.');
    }
  };

  // Take picture
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      
      // Add to photos and select
      setPhotos(prevPhotos => [asset, ...prevPhotos]);
      setSelectedPhotos(prev => {
        if (prev.length < MAX_IMAGES) {
          return [...prev, { ...asset, order: prev.length + 1 }];
        }
        return prev;
      });
      
      setCameraModalVisible(false);
    }
  };

  // Open image picker
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES,
    });

    if (!result.canceled) {
      const newAssets = result.assets.map(asset => ({
        uri: asset.uri,
        id: asset.uri, // Use URI as unique identifier since it's from picker
      }));

      // Add new images to photos list
      setPhotos(prevPhotos => [...newAssets, ...prevPhotos]);

      // Select new images
      setSelectedPhotos(prev => {
        const remainingSlots = MAX_IMAGES - prev.length;
        const newSelection = newAssets.slice(0, remainingSlots);
        return [
          ...prev,
          ...newSelection.map((photo, index) => ({
            ...photo,
            order: prev.length + index + 1
          }))
        ];
      });
    }
  };

  // Handle next navigation
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

  // Render individual photo
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
      {/* Image Selection Buttons */}
      <View style={styles.actionButtons}>
        <ThemedButton onPress={pickImage} type="default" style={styles.actionButton}>
          <Ionicons name="image-outline" size={24} color="black" />
          <Text style={styles.actionButtonText}>Gallery</Text>
        </ThemedButton>
        <ThemedButton onPress={openCamera} type="default" style={styles.actionButton}>
          <Ionicons name="camera-outline" size={24} color="black" />
          <Text style={styles.actionButtonText}>Camera</Text>
        </ThemedButton>
      </View>

      {/* Photos Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id || item.uri}
        numColumns={3}
      />

      {/* Camera Modal */}
  <Modal
    animationType="slide"
    transparent={false}
    visible={cameraModalVisible}
    onRequestClose={() => setCameraModalVisible(false)}
  >
    <CameraView 
      style={styles.camera} 
      facing={cameraType}
      ref={cameraRef}
    >
      <View style={styles.cameraButtonContainer}>
        <TouchableOpacity 
          style={styles.cameraCloseButton} 
          onPress={() => setCameraModalVisible(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cameraFlipButton} 
          onPress={() => {
            setCameraType(
              cameraType === 'back'
                ? 'front'
                : 'back'
            );
          }}
        >
          <Ionicons name="camera-reverse-outline" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cameraCaptureButton} 
          onPress={takePicture}
        >
          <View style={styles.cameraCaptureInnerButton} />
        </TouchableOpacity>
      </View>
    </CameraView>
  </Modal>

      {/* Next Button */}
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  actionButtonText: {
    marginLeft: 10,
  },
  camera: {
    flex: 1,
  },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
  },
  cameraCloseButton: {
    alignSelf: 'flex-start',
  },
  cameraFlipButton: {
    alignSelf: 'flex-end',
  },
  cameraCaptureButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 15,
    borderWidth: 2,
    borderColor: 'black',
  },
  cameraCaptureInnerButton: {
    width: 50,
    height: 50,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'white',
  },
});