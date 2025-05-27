import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Modal, SafeAreaView, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import ThemedButton from '@/components/ThemeButton';

const CATEGORIES = ['desks', 'chairs', 'others'] as const;
type Category = typeof CATEGORIES[number];

const { width } = Dimensions.get('window');
const PREVIEW_SIZE = width / 4 - 10;

export default function DescriptionLocation() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [streetName, setStreetName] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [category, setCategory] = useState<Category>('others');
  const { images } = useLocalSearchParams();
  const router = useRouter();
  const imageUris = JSON.parse(images as string);

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

  const getStreetName = async (latitude, longitude) => {
    try {
      const response = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (response[0]) {
        setStreetName(response[0].street || 'Unknown location');
      }
    } catch (error) {
      console.error('Error getting street name:', error);
      setStreetName('Unknown location');
    }
  };

  const handleLocationSelect = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({
      coords: { latitude, longitude },
    });
    getStreetName(latitude, longitude);
    setShowMap(false);
  };

  const handleNext = () => {
    router.push({
      pathname: '/create-post/review-submit',
      params: { 
        images: images,
        description,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        streetName,
        category
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.contentContainer}>
        {/* Image Preview Section */}
        <View style={styles.imagePreviewContainer}>
          <Text style={styles.sectionTitle}>Selected Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {imageUris.map((uri, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri }} style={styles.previewImage} />
                <View style={styles.imageOrder}>
                  <Text style={styles.imageOrderText}>{index + 1}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Category Selection */}
        <Text style={styles.sectionTitle}>Item Category</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonSelected
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.categoryButtonText,
                category === cat && styles.categoryButtonTextSelected
              ]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description Input */}
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="What's on your mind?"
          multiline
        />

        {/* Location Selection */}
        <Text style={styles.sectionTitle}>Location</Text>
        <ThemedButton
          title="Select Location"
          onPress={() => setShowMap(true)}
          type="secondary"
          size="medium"
          style={styles.locationButton}
        />
        {streetName && <Text style={styles.locationText}>{streetName}</Text>}
      </ScrollView>

      {/* Back Button */}
      <ThemedButton
        onPress={() => router.back()}
        type="default"
        size="large"
        style={styles.backButton}
      >
        <AntDesign name="arrowleft" size={24} color="black" />
      </ThemedButton>

      {/* Next Button */}
      <ThemedButton
        onPress={handleNext}
        type="default"
        size="large"
        style={styles.nextButton}
        disabled={!description || !location}
      >
        <AntDesign name="arrowright" size={24} color="black" />
      </ThemedButton>

      <Modal visible={showMap} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location?.coords.latitude || 0,
              longitude: location?.coords.longitude || 0,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleLocationSelect}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
              />
            )}
          </MapView>
          <ThemedButton
            title="Close Map"
            onPress={() => setShowMap(false)}
            type="primary"
            size="medium"
            style={styles.closeMapButton}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  imagePreviewContainer: {
    marginBottom: 20,
  },
  imageScroll: {
    flexGrow: 0,
  },
  imagePreview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOrder: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOrderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  input: {
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    padding: 10,
    textAlignVertical: 'top',
  },
  locationButton: {
    marginBottom: 10,
  },
  locationText: {
    marginVertical: 10,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '90%',
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
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'visible',
  },
  closeMapButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'visible',
  },
});