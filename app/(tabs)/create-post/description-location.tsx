import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Modal, SafeAreaView, Image, ScrollView, Dimensions, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import ThemedButton from '@/components/ThemeButton';
import { useTranslation } from '@/hooks/useTranslation';

const CATEGORIES = ['desks', 'chairs', 'others'] as const;
type Category = typeof CATEGORIES[number];

const { width } = Dimensions.get('window');
const PREVIEW_SIZE = width / 4 - 10;

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coords: LocationCoords;
}

interface SearchResult {
  id: string;
  latitude: number;
  longitude: number;
  displayName: string;
  shortName: string;
}

export default function DescriptionLocation() {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationState | null>(null);
  const [streetName, setStreetName] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [category, setCategory] = useState<Category>('others');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
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

  const getStreetName = async (latitude: number, longitude: number) => {
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

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const results = await Location.geocodeAsync(query);
      const formattedResults = await Promise.all(
        results.slice(0, 5).map(async (result, index) => {
          try {
            const reverseGeocode = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });
            const address = reverseGeocode[0];
            const displayName = [
              address?.name,
              address?.street,
              address?.city,
              address?.region,
              address?.country
            ].filter(Boolean).join(', ');
            
            return {
              id: index.toString(),
              latitude: result.latitude,
              longitude: result.longitude,
              displayName: displayName || 'Unknown location',
              shortName: address?.name || address?.street || 'Location'
            };
          } catch (error) {
            return {
              id: index.toString(),
              latitude: result.latitude,
              longitude: result.longitude,
              displayName: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
              shortName: 'Location'
            };
          }
        })
      );
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search for location');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    setLocation({
      coords: { latitude: result.latitude, longitude: result.longitude },
    });
    setStreetName(result.shortName);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setShowMap(false);
  };

  const handleLocationSelect = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({
      coords: { latitude, longitude },
    });
    getStreetName(latitude, longitude);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setShowMap(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleNext = () => {
    router.push({
      pathname: '/create-post/review-submit',
      params: { 
        images: images,
        description,
        latitude: location?.coords.latitude || 0,
        longitude: location?.coords.longitude || 0,
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
            {imageUris.map((uri: string, index: number) => (
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
                {t(`categories.${cat}`)}
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
        <SafeAreaView style={styles.mapContainer}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a place..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchLocation(text);
                }}
                returnKeyType="search"
                onSubmitEditing={() => searchLocation(searchQuery)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowMap(false);
                clearSearch();
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Content Area - Map and Search Results */}
          <View style={styles.contentArea}>
            {/* Search Results */}
            {showSearchResults && (
              <View style={styles.searchResultsContainer}>
                {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#666" />
                    <Text style={styles.loadingText}>Searching...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => handleSearchResultSelect(item)}
                      >
                        <Ionicons name="location-outline" size={20} color="#666" style={styles.resultIcon} />
                        <View style={styles.resultTextContainer}>
                          <Text style={styles.resultTitle}>{item.shortName}</Text>
                          <Text style={styles.resultSubtitle} numberOfLines={2}>
                            {item.displayName}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    style={styles.searchResultsList}
                    keyboardShouldPersistTaps="handled"
                  />
                )}
              </View>
            )}

            {/* Map */}
            <MapView
              style={[styles.map, showSearchResults && styles.mapWithResults]}
              initialRegion={{
                latitude: location?.coords.latitude || 37.78825,
                longitude: location?.coords.longitude || -122.4324,
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

            {/* Instructions */}
            {!showSearchResults && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  Search for a place above or tap on the map to select a location
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
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
    flex: 1,
    width: '100%',
    height: '100%',
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
  // Search styles
  searchHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 2000, // Ensure search header stays above overlay
    elevation: 10, // For Android
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    maxHeight: '40%',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mapWithResults: {
    flex: 1,
    height: '60%',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  searchResultsList: {
    backgroundColor: '#fff',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultIcon: {
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});