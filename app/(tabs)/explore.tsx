import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import SlidingPostView from '@/components/SlidingPostView';
import LocationPostsList from '@/components/LocationPostsList';
import * as Location from 'expo-location';

interface Post {
  id: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // add other post properties as needed
}

interface LocationData {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  posts: Post[];
}

export default function MapViewPosts({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<LocationData[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
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

      // Group posts by location
      const groupedPosts = postsWithCoords.reduce((acc, post) => {
        if (!post.coordinates) return acc;
        
        const key = `${post.coordinates.latitude.toFixed(5)},${post.coordinates.longitude.toFixed(5)}`;
        if (!acc[key]) {
          acc[key] = {
            coordinates: post.coordinates,
            posts: []
          };
        }
        acc[key].posts.push(post);
        return acc;
      }, {});

      setPosts(Object.values(groupedPosts));
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    }
  };

  const parseEWKBString = (ewkb: string): { latitude: number; longitude: number; } | null => {
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

  const ieee754ToDouble = (bytes: Uint8Array): number => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    bytes.forEach((b: number, i: number) => view.setUint8(i, b));
    return view.getFloat64(0, true);
  };

  const handleMarkerPress = (locationData: LocationData): void => {
    setSelectedLocation(locationData);
  };

  const handlePostSelect = (post: Post): void => {
    setSelectedPost(post);
    setSelectedLocation(null);
  };

  const handleCloseLocationList = () => {
    setSelectedLocation(null);
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
        {posts.map((locationData, index) => (
          locationData.coordinates && (
            <Marker
              key={index}
              coordinate={locationData.coordinates}
              onPress={() => handleMarkerPress(locationData)}
            />
          )
        ))}
      </MapView>

      {selectedLocation && (
        <LocationPostsList
          posts={selectedLocation.posts}
          onPostSelect={handlePostSelect}
          onClose={handleCloseLocationList}
        />
      )}

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    color: 'red',
  },
});