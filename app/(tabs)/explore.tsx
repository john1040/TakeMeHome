import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Text, TouchableWithoutFeedback } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';

export default function MapViewPosts({ userId }) {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
  };

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  const handleMarkerPress = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedPost && (
                  <PostItem post={selectedPost} userId={userId} />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});