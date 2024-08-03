import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Image, Alert, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AntDesign } from '@expo/vector-icons';

const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co';

// Initialize the geocoder
Geocoder.init("AIzaSyD2438foVr7gc0j35AtlGx2FlcS1OmyrI0"); 

export default function CreatePost() {
  const { session, userProfile, isLoading } = useAuth();

  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [streetName, setStreetName] = useState<string>('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      getStreetName(location.coords.latitude, location.coords.longitude);
    })();
  }, []);

  const getStreetName = async (latitude: number, longitude: number) => {
    try {
      const response = await Geocoder.from(latitude, longitude);
      const address = response.results[0].formatted_address;
      setStreetName(address);
    } catch (error) {
      console.error('Error getting street name:', error);
      setStreetName('Unknown location');
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && images.length < 4) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImages(prevImages => [...prevImages, manipResult.uri]);
    }
  };

  const handleLocationSelect = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    getStreetName(latitude, longitude);
  };

  const handleDeleteImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description || images.length === 0 || !selectedLocation) {
      Alert.alert('Please fill in all fields');
      return;
    }

    try {
      const imageUrls = [];
      for (const image of images) {
        const imageFileName = `${FileSystem.documentDirectory}${Date.now()}.jpg`;
        await FileSystem.copyAsync({
          from: image,
          to: imageFileName,
        });

        const { data, error } = await supabase.storage
          .from('posts')
          .upload(`public/${userProfile.id}/${Date.now()}.jpg`, imageFileName);

        if (error) throw error;

        const imageUrl = `${supabaseUrl}/storage/v1/object/public/posts/${data.path}`;
        imageUrls.push(imageUrl);
      }

      const { error: insertError } = await supabase
        .from('post')
        .insert([
          {
            description,
            user_id: userProfile.id,
            images: imageUrls,
            street_name: streetName,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          },
        ]);

      if (insertError) throw insertError;

      Alert.alert('Post created successfully!');
      setDescription('');
      setImages([]);
      setSelectedLocation(null);
      setStreetName('');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error creating post: ' + (error as Error).message);
    }
  };

  const renderImagePreview = () => {
    return (
      <View style={styles.imageGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.imageWrapper}>
            {images[index] ? (
              <>
                <Image source={{ uri: images[index] }} style={styles.image} />
                <TouchableOpacity
                  style={styles.deleteIcon}
                  onPress={() => handleDeleteImage(index)}
                >
                  <AntDesign name="closecircle" size={24} color="red" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="What's on your mind?"
        multiline
      />
      <Button title="Pick an image" onPress={pickImage} />
      {renderImagePreview()}
      <Button title="Select Location" onPress={() => setShowMap(true)} />
      {streetName && <TextInput style={styles.input} value={streetName} editable={false} />}
      <Button title="Create Post" onPress={handleSubmit} />

      <Modal visible={showMap} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location?.coords.latitude || 0.0,
              longitude: location?.coords.longitude || 0.0,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
            onPress={handleLocationSelect}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
              />
            )}
          </MapView>
          <Button title="Close Map" onPress={() => setShowMap(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    padding: 50,
    justifyContent: 'center',
  },
  input: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 20,
  },
  imageWrapper: {
    width: '50%',
    height: 150,
    padding: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'gray',
    borderRadius: 10
  },
  deleteIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '90%',
  },
});
