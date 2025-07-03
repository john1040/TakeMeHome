import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, View, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import LocationPostsList from '@/components/LocationPostsList';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { palette } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';

const CATEGORIES = ['all', 'desks', 'chairs', 'others'] as const;
type Category = typeof CATEGORIES[number];

interface Post {
  id: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  category: string;
  title: string;
  description: string;
  geolocation?: string;
  availability_status?: string;
  image?: { url: string };
}

interface LocationData {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  posts: Post[];
}

export default function MapViewPosts({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [posts, setPosts] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
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
      const { data, error: fetchError } = await supabase
        .from('post')
        .select(`
          *,
          image:image(url),
          geolocation,
          availability_status
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const postsWithCoords = data.map(post => ({
        ...post,
        coordinates: parseEWKBString(post.geolocation)
      }));

      // Group posts by location
      const groupedPosts = postsWithCoords.reduce((acc: Record<string, LocationData>, post: Post) => {
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
    } catch (fetchError) {
      console.error('Error fetching posts:', fetchError);
      setError('Failed to load posts. Please try again later.');
    }
  };

  const parseEWKBString = (ewkb: string): { latitude: number; longitude: number; } | null => {
    if (!ewkb) {
      console.warn('Geolocation data is missing for a post');
      return null;
    }
    
    try {
      ewkb = ewkb.replace(/[^0-9A-Fa-f]/g, '');
      const bytes = new Uint8Array(ewkb.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const littleEndian = bytes[0] === 1;
      let index = 1 + 4 + 4;
      const xBytes = bytes.slice(index, index + 8);
      index += 8;
      const yBytes = bytes.slice(index, index + 8);
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
    router.push(`/(app)/post-details/${post.id}`);
    setSelectedLocation(null);
  };

  const handleCloseLocationList = () => {
    setSelectedLocation(null);
  };

  const filteredPosts = posts.filter(locationData => {
    if (selectedCategory === 'all') return true;
    return locationData.posts.some(post => post.category === selectedCategory);
  });

  const CategoryFilter = () => (
    <ThemedView variant="surface" style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.filterButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            {category === 'all' && (
              <Ionicons 
                name="grid-outline" 
                size={16} 
                color={selectedCategory === category ? palette.white : palette.teal}
                style={styles.filterIcon}
              />
            )}
            <ThemedText
              style={[
                styles.filterButtonText,
                selectedCategory === category && styles.filterButtonTextActive
              ]}
            >
              {t(`categories.${category}`)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );

  if (error) {
    return (
      <ThemedView style={styles.errorContainer} variant="surface">
        <Ionicons name="alert-circle-outline" size={32} color={palette.gold} />
        <ThemedText type="subtitle" style={styles.errorTitle}>
          Oops!
        </ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        customMapStyle={Platform.OS === 'android' ? [
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: palette.carbon }]
          },
          {
            featureType: 'water',
            elementType: 'geometry.fill',
            stylers: [{ color: palette.teal + '40' }]
          }
        ] : undefined}
      >
        {filteredPosts.map((locationData, index) => (
          locationData.coordinates && (
            <Marker
              key={index}
              coordinate={locationData.coordinates}
              onPress={() => handleMarkerPress(locationData)}
              pinColor={palette.deepTeal}
            />
          )
        ))}
      </MapView>

      <CategoryFilter />

      {selectedLocation && (
        <LocationPostsList
          posts={selectedLocation.posts}
          onPostSelect={handlePostSelect}
          onClose={handleCloseLocationList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: palette.gold,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: palette.carbon,
    textAlign: 'center',
  },
  filterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 16,
    right: 16,
    zIndex: 1,
    borderRadius: 28,
    backgroundColor: palette.white,
    shadowColor: palette.carbon,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  filterScroll: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${palette.teal}10`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: palette.teal,
  },
  filterButtonActive: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: palette.teal,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: palette.white,
  },
});