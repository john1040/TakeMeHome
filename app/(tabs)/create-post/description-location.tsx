import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Modal, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import ThemedButton from '@/components/ThemeButton';  // Adjust the import path as necessary

export default function DescriptionLocation() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [streetName, setStreetName] = useState('');
  const [showMap, setShowMap] = useState(false);
  const { images } = useLocalSearchParams();
  const router = useRouter();

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
        streetName
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="What's on your mind?"
          multiline
        />
        <ThemedButton
          title="Select Location"
          onPress={() => setShowMap(true)}
          type="secondary"
          size="medium"
        />
        {streetName && <Text style={styles.locationText}>{streetName}</Text>}
      </View>

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
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
  locationText: {
    marginVertical: 10,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeMapButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
});