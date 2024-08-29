import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import SlidingPostView from '@/components/SlidingPostView';
import * as Location from 'expo-location';

export default function MapViewPosts({ userId }: { userId: string }) {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 25.033964,
    longitude: 121.564468,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    fetchPosts();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Permission to access location was denied. The map will show a default location.'
      );
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setUserLocation(location);
    setMapRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('post')
        .select(`
          *,
          image:image(url),
          geolocation
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithCoords = data.map(post => ({
        ...post,
        coordinates: parseEWKBString(post.geolocation)
      }));
      setPosts(postsWithCoords);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    }
  };

  
  const parseEWKBString = (ewkb) => {
    if (!ewkb) {
      console.warn('Geolocation data is missing for a post');
      return null;
    }
    
    try {
      // Ensure ewkb is a string and remove any non-hex characters
      ewkb = ewkb.replace(/[^0-9A-Fa-f]/g, '');
      
      // Convert hex string to byte array
      const bytes = new Uint8Array(ewkb.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      // Check endianness (1 = little-endian, 0 = big-endian)
      const littleEndian = bytes[0] === 1;
      
      // Skip to the coordinate data (skip endian byte, type, and SRID)
      let index = 1 + 4 + 4;
      
      // Read X (longitude)
      const xBytes = bytes.slice(index, index + 8);
      index += 8;
      
      // Read Y (latitude)
      const yBytes = bytes.slice(index, index + 8);
      
      // Convert bytes to doubles
      const x = littleEndian ? ieee754ToDouble(xBytes) : ieee754ToDouble(xBytes.reverse());
      const y = littleEndian ? ieee754ToDouble(yBytes) : ieee754ToDouble(yBytes.reverse());
      
      return { latitude: y, longitude: x };
    } catch (error) {
      console.warn('Invalid EWKB format:', ewkb, error);
      return null;
    }
  };

  // Helper function to convert IEEE 754 binary64 to double
  const ieee754ToDouble = (bytes) => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    bytes.forEach((b, i) => view.setUint8(i, b));
    return view.getFloat64(0, true);
  };


  const handleMarkerPress = (post) => {
    setSelectedPost(post);
  };

  const handleCloseSlider = () => {
    setSelectedPost(null);
  };

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {posts.map((post) => (
          post.coordinates && (
            <Marker
              key={post.id}
              coordinate={post.coordinates}
              onPress={() => handleMarkerPress(post)}
            />
          )
        ))}
      </MapView>

      <SlidingPostView
        post={selectedPost}
        userId={userId}
        onClose={handleCloseSlider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});