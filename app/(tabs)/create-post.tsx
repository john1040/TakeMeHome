import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Image, Alert, StyleSheet, Modal } from 'react-native';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co'


// Initialize the geocoder
Geocoder.init("AIzaSyD2438foVr7gc0j35AtlGx2FlcS1OmyrI0"); 

export default function CreatePost() {
  const { session, userProfile, isLoading } = useAuth();

  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationObject | null>(null);
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
        console.log(Geocoder.isInit)
      const response = await Geocoder.from(latitude, longitude);
      const address = response.results[0].formatted_address;
      setStreetName(address);
    } catch (error) {
      console.error('Error getting street name:', error);
      setStreetName('Unknown location');
    }
  };

  const handleLocationSelect = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({
      coords: { latitude, longitude },
      timestamp: Date.now(),
    } as LocationObject);
    getStreetName(latitude, longitude);
    setShowMap(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const compressedImage = await compressImage(result.assets[0].uri);
      setImage(compressedImage);
    }
  };

  const compressImage = async (uri: string) => {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], // Resize to width of 1080px, height will adjust automatically
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  };

  const handleSubmit = async () => {
    if (!description || !image || !location) {
      Alert.alert('Please fill in all fields and wait for location data');
      return;
    }

    try {
      console.log('Starting image upload process...');

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(image);
      console.log('File info:', fileInfo);

      // Read the file as base64
      console.log('Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
      console.log('File read successfully. Base64 length:', base64.length);
      
      // Convert base64 to ArrayBuffer
      console.log('Converting base64 to ArrayBuffer...');
      const arrayBuffer = new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0))).buffer;
      console.log('ArrayBuffer created. Size:', arrayBuffer.byteLength);

      const filename = image.split('/').pop();
      const fileExt = filename?.split('.').pop();
      
      // Upload the image
      console.log('Uploading image to Supabase...');
      const { data: imageData, error: imageError } = await supabase.storage
        .from('post-images')
        .upload(`${Date.now()}-${filename}`, arrayBuffer, {
          contentType: `image/${fileExt}`
        });

      if (imageError) {
        console.error('Image upload error:', imageError);
        throw imageError;
      }
      
      console.log('Image uploaded successfully. Path:', imageData.path);
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${imageData.path}`;

      // Create the post
      const { data, error } = await supabase
        .from('post')
        .insert({
          user_id: session?.user.id,
          description: description,
          geolocation: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
          street_name: streetName,
        })
        .select();
      console.log('Post created successfully. ID:', data[0].id);

      // Add the image to the Image table
      console.log('Adding image to Image table...');
      const { error: imageInsertError } = await supabase
        .from('image')
        .insert({
          post_id: data[0].id,
          url: imageUrl,
        });

      if (imageInsertError) {
        console.error('Error inserting image:', imageInsertError);
        throw imageInsertError;
      }

      console.log('Image added to Image table successfully');

      Alert.alert('Post created successfully!');
      setDescription('');
      setImage(null);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error creating post: ' + (error as Error).message);
    }
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
    {image && <Image source={{ uri: image }} style={styles.image} />}
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
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
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
      padding: 50,
      justifyContent: 'center'
    },
    input: {
      height: 100,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 20,
      padding: 10,
    },
    image: {
      width: 200,
      height: 200,
      resizeMode: 'contain',
      marginTop: 20,
    },
    mapContainer: {
        flex: 1,
      justifyContent: 'center'
    },
    map: {
      width: '100%',
      height: '90%',
    },
  });