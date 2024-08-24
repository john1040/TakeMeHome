// import React, { useState, useEffect } from 'react';
// import { View, TextInput, Button, Image, Alert, StyleSheet, Modal, TouchableOpacity, Text, FlatList } from 'react-native';
// import * as Location from 'expo-location';
// import { LocationObject } from 'expo-location';
// import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system';
// import * as ImageManipulator from 'expo-image-manipulator';
// import MapView, { Marker } from 'react-native-maps';
// import Geocoder from 'react-native-geocoding';
// import { supabase } from '@/lib/supabase';
// import { useAuth } from '@/hooks/useAuth';
// import ImagePreview from '@/components/ImagePreview';
// import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

// const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co'

// // Initialize the geocoder
// Geocoder.init("AIzaSyD2438foVr7gc0j35AtlGx2FlcS1OmyrI0"); 

// const MAX_IMAGES = 6;

// type ImageItem = {
//   id: string;
//   uri: string;
// };

// export default function CreatePost() {
//   const { session, userProfile, isLoading } = useAuth();

//   const [description, setDescription] = useState('');
//   const [images, setImages] = useState<ImageItem[]>([]);
//   const [location, setLocation] = useState<LocationObject | null>(null);
//   const [streetName, setStreetName] = useState<string>('');
//   const [showMap, setShowMap] = useState(false);
//   const [draggedImage, setDraggedImage] = useState<ImageItem | null>(null);

  
//   const onDragStart = (item: ImageItem) => {
//     setDraggedImage(item);
//   };

//   const onDragEnd = (item: ImageItem) => {
//     console.log('inside')
//     if (draggedImage) {
//       const newImages = [...images];
//       const draggedIndex = newImages.findIndex((img) => img.id === draggedImage.id);
//       const targetIndex = newImages.findIndex((img) => img.id === item.id);
//       newImages.splice(draggedIndex, 1);
//       newImages.splice(targetIndex, 0, draggedImage);
//       setImages(newImages);
//       setDraggedImage(null);
//     }
//   };
//   useEffect(() => {
//     (async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission to access location was denied');
//         return;
//       }

//       let location = await Location.getCurrentPositionAsync({});
//       setLocation(location);
//       getStreetName(location.coords.latitude, location.coords.longitude);
//     })();
//   }, []);

//   const getStreetName = async (latitude: number, longitude: number) => {
//     try {
//       const response = await Geocoder.from(latitude, longitude);
//       const address = response.results[0].formatted_address;
//       setStreetName(address);
//     } catch (error) {
//       console.error('Error getting street name:', error);
//       setStreetName('Unknown location');
//     }
//   };

//   const handleLocationSelect = (event: any) => {
//     const { latitude, longitude } = event.nativeEvent.coordinate;
//     setLocation({
//       coords: { latitude, longitude },
//       timestamp: Date.now(),
//     } as LocationObject);
//     getStreetName(latitude, longitude);
//     setShowMap(false);
//   };

//   const pickImage = async () => {
//     if (images.length >= MAX_IMAGES) {
//       Alert.alert('Maximum images reached', `You can only select up to ${MAX_IMAGES} images.`);
//       return;
//     }

//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const compressedImage = await compressImage(result.assets[0].uri);
//       setImages(prev => [...prev, { id: Date.now().toString(), uri: compressedImage }]);
//     }
//   };

//   const compressImage = async (uri: string) => {
//     const manipResult = await ImageManipulator.manipulateAsync(
//       uri,
//       [{ resize: { width: 1080 } }],
//       { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
//     );
//     return manipResult.uri;
//   };

//   const removeImage = (id: string) => {
//     setImages(prev => prev.filter(img => img.id !== id));
//   };

//   const renderImageItem = ({ item }: { item: ImageItem }) => {
//     return (
//       <TouchableOpacity
//         onPressIn={() => onDragStart(item)}
//         onPressOut={() => onDragEnd(item)}
//         style={[
//           styles.imageItem,
//           draggedImage?.id === item.id && styles.draggedItem
//         ]}
//       >
//         <Image source={{ uri: item.uri }} style={styles.thumbnail} />
//         <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(item.id)}>
//           <Text style={styles.removeButtonText}>X</Text>
//         </TouchableOpacity>
//       </TouchableOpacity>
//     );
//   };

//   const handleSubmit = async () => {
//     if (!description || images.length === 0 || !location) {
//       Alert.alert('Please fill in all fields and wait for location data');
//       return;
//     }

//     try {
//       console.log('Starting image upload process...');

//       const uploadedImages = await Promise.all(images.map(async (image, index) => {
//         const fileInfo = await FileSystem.getInfoAsync(image.uri);
//         const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: FileSystem.EncodingType.Base64 });
//         const arrayBuffer = new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0))).buffer;

//         const filename = image.uri.split('/').pop();
//         const fileExt = filename?.split('.').pop();
        
//         const { data: imageData, error: imageError } = await supabase.storage
//           .from('post-images')
//           .upload(`${Date.now()}-${index}-${filename}`, arrayBuffer, {
//             contentType: `image/${fileExt}`
//           });

//         if (imageError) throw imageError;
        
//         return `${supabaseUrl}/storage/v1/object/public/post-images/${imageData.path}`;
//       }));

//       const { data, error } = await supabase
//         .from('post')
//         .insert({
//           user_id: session?.user.id,
//           description: description,
//           geolocation: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
//           street_name: streetName,
//         })
//         .select();

//       if (error) throw error;

//       await Promise.all(uploadedImages.map(async (url, index) => {
//         const { error: imageInsertError } = await supabase
//           .from('image')
//           .insert({
//             post_id: data[0].id,
//             url: url,
//             order: index,
//           });

//         if (imageInsertError) throw imageInsertError;
//       }));

//       Alert.alert('Post created successfully!');
//       setDescription('');
//       setImages([]);
//     } catch (error) {
//       console.error('Error in handleSubmit:', error);
//       Alert.alert('Error creating post: ' + (error as Error).message);
//     }
//   };

//   return (
//     <View style={styles.container}>
      
//       <Button title="Pick an image" onPress={pickImage} />
//       <DraggableFlatList
//         data={images}
//         renderItem={renderImageItem}
//         keyExtractor={(item) => item.id}
//         onDragEnd={({ data }) => setImages(data)}
//         numColumns={2}
//         style={styles.imageGrid}
//       />
//       {images.length < MAX_IMAGES && (
//         <TouchableOpacity style={styles.placeholderImage} onPress={pickImage}>
//           <Text style={styles.placeholderText}>+</Text>
//         </TouchableOpacity>
//       )}
//       {/* <ImagePreview 
//       /> */}
//       <Button title="Select Location" onPress={() => setShowMap(true)} />
//       {streetName && <TextInput style={styles.input} value={streetName} editable={false} />}
//       <TextInput
//         style={styles.input}
//         value={description}
//         onChangeText={setDescription}
//         placeholder="What's on your mind?"
//         multiline
//       />
//       <Button title="Create Post" onPress={handleSubmit} />

//       <Modal visible={showMap} animationType="slide">
//         <View style={styles.mapContainer}>
//           <MapView
//             style={styles.map}
//             initialRegion={{
//               latitude: location?.coords.latitude || 0.0,
//               longitude: location?.coords.longitude || 0.0,
//               latitudeDelta: 0.0922,
//               longitudeDelta: 0.0421,
//             }}
//             showsUserLocation={true}
//             onPress={handleLocationSelect}
//           >
//             {location && (
//               <Marker
//                 coordinate={{
//                   latitude: location.coords.latitude,
//                   longitude: location.coords.longitude,
//                 }}
//               />
//             )}
//           </MapView>
//           <Button title="Close Map" onPress={() => setShowMap(false)} />
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   input: {
//     height: 100,
//     borderColor: 'gray',
//     borderWidth: 1,
//     marginBottom: 20,
//     padding: 10,
//   },
//   imageGrid: {
//     marginBottom: 20,
//   },
//   activeItem: {
//     opacity: 0.5,
//   },
//   thumbnail: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//   },
//   removeButton: {
//     position: 'absolute',
//     top: 5,
//     right: 5,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   removeButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   placeholderImage: {
//     width: '45%',
//     aspectRatio: 1,
//     margin: '1%',
//     backgroundColor: '#e0e0e0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 8,
//   },
//   placeholderText: {
//     fontSize: 24,
//     color: '#888',
//   },
//   mapContainer: {
//     flex: 1,
//   },
//   map: {
//     width: '100%',
//     height: '90%',
//   },
//   imageItem: {
//     width: '45%',
//     aspectRatio: 1,
//     margin: '1.5%',
//     position: 'relative',
//   },
//   draggedItem: {
//     opacity: 0.7,
//     transform: [{ scale: 1.2 }],
//   },
// });


import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, Alert, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const MAX_IMAGES = 4;

export default function CreatePost() {
  const { session } = useAuth();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [streetName, setStreetName] = useState('');
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

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Maximum images reached', `You can only select up to ${MAX_IMAGES} images.`);
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({
      coords: { latitude, longitude },
    });
    getStreetName(latitude, longitude);
    setShowMap(false);
  };

  const handleSubmit = async () => {
    if (images.length === 0 || !description || !location) {
      Alert.alert('Please fill in all fields and select at least one image');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('post')
        .insert({
          user_id: session?.user.id,
          description: description,
          geolocation: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
          street_name: streetName,
        })
        .select();

      if (error) throw error;

      // Handle image upload here
      // You'll need to implement this part based on your Supabase setup

      Alert.alert('Post created successfully!');
      setStep(1);
      setImages([]);
      setDescription('');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error creating post: ' + error.message);
    }
  };

  const ImageSelectionStep = () => (
    <View style={styles.stepContainer}>
      <FlatList
        data={images}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => removeImage(index)}>
            <Image source={{ uri: item }} style={styles.image} />
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
      />
      {images.length < MAX_IMAGES && (
        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
      <Button title="Next" onPress={() => setStep(2)} disabled={images.length === 0} />
    </View>
  );

  const DescriptionAndLocationStep = () => (
    <View style={styles.stepContainer}>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="What's on your mind?"
        multiline
      />
      <Button title="Select Location" onPress={() => setShowMap(true)} />
      {streetName && <Text style={styles.locationText}>{streetName}</Text>}
      <View style={styles.navigationButtons}>
        <Button title="Back" onPress={() => setStep(1)} />
        <Button title="Next" onPress={() => setStep(3)} disabled={!description || !location} />
      </View>
    </View>
  );

  const ReviewAndSubmitStep = () => (
    <View style={styles.stepContainer}>
      <FlatList
        data={images}
        renderItem={({ item }) => <Image source={{ uri: item }} style={styles.previewImage} />}
        keyExtractor={(item, index) => index.toString()}
        horizontal
      />
      <Text style={styles.previewText}>{description}</Text>
      <Text style={styles.previewText}>{streetName}</Text>
      <View style={styles.navigationButtons}>
        <Button title="Back" onPress={() => setStep(2)} />
        <Button title="Submit" onPress={handleSubmit} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {step === 1 && <ImageSelectionStep />}
      {step === 2 && <DescriptionAndLocationStep />}
      {step === 3 && <ReviewAndSubmitStep />}
      
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
          <Button title="Close Map" onPress={() => setShowMap(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  input: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
  image: {
    width: 150,
    height: 150,
    margin: 5,
  },
  addButton: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    margin: 5,
  },
  addButtonText: {
    fontSize: 40,
    color: '#888',
  },
  locationText: {
    marginVertical: 10,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '90%',
  },
  previewImage: {
    width: 100,
    height: 100,
    margin: 5,
  },
  previewText: {
    marginVertical: 10,
  },
});