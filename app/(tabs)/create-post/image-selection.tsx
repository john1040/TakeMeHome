// import React, { useState } from 'react';
// import { View, Image, FlatList, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { useRouter } from 'expo-router';
// import ThemedButton from '@/components/ThemeButton';
// import { AntDesign } from '@expo/vector-icons';

// const MAX_IMAGES = 4;

// export default function ImageSelection() {
//   const [images, setImages] = useState([]);
//   const router = useRouter();

//   const pickImage = async () => {
//     if (images.length >= MAX_IMAGES) {
//       Alert.alert('Maximum images reached', `You can only select up to ${MAX_IMAGES} images.`);
//       return;
//     }

//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       selectionLimit: MAX_IMAGES - images.length,
//       aspect: [4, 3],
//       quality: 1,
//     });

//     if (!result.canceled && result.assets.length > 0) {
//       const newImages = result.assets.map((asset, index) => ({
//         uri: asset.uri,
//         order: images.length + index + 1
//       }));
//       setImages([...images, ...newImages].slice(0, MAX_IMAGES));
//     }
//   };

//   const removeImage = (index) => {
//     setImages(prevImages => {
//       const updatedImages = prevImages.filter((_, i) => i !== index);
//       return updatedImages.map((img, i) => ({ ...img, order: i + 1 }));
//     });
//   };

//   const handleNext = () => {
//     if (images.length === 0) {
//       Alert.alert('No images selected', 'Please select at least one image to continue.');
//       return;
//     }
//     router.push({
//       pathname: '/create-post/description-location',
//       params: { images: JSON.stringify(images.map(img => img.uri)) }
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={images}
//         renderItem={({ item, index }) => (
//           <TouchableOpacity onPress={() => removeImage(index)}>
//             <View style={styles.imageContainer}>
//               <Image source={{ uri: item.uri }} style={styles.image} />
//               <View style={styles.orderBadge}>
//                 <Text style={styles.orderText}>{item.order}</Text>
//               </View>
//             </View>
//           </TouchableOpacity>
//         )}
//         keyExtractor={(item, index) => index.toString()}
//         numColumns={2}
//       />
//       {images.length < MAX_IMAGES && (
//         <TouchableOpacity style={styles.addButton} onPress={pickImage}>
//           <Text style={styles.addButtonText}>+</Text>
//         </TouchableOpacity>
//       )}
//       <ThemedButton
//         onPress={handleNext}
//         type="default"
//         size="large"
//         style={styles.nextButton}
//         disabled={images.length === 0}
//       >
//         <View style={styles.nextButtonContent}>
//           <AntDesign name="arrowright" size={24} color="black" />
//         </View>
//       </ThemedButton>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   imageContainer: {
//     position: 'relative',
//     margin: 5,
//   },
//   image: {
//     width: 150,
//     height: 150,
//   },
//   orderBadge: {
//     position: 'absolute',
//     top: 5,
//     right: 5,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     borderRadius: 12,
//     width: 24,
//     height: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   orderText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   addButton: {
//     width: 150,
//     height: 150,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#e0e0e0',
//     margin: 5,
//   },
//   addButtonText: {
//     fontSize: 40,
//     color: '#888',
//   },
//   nextButton: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: 'white',
//     borderColor: 'black',
//     borderWidth: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 0,
//   },
//   nextButtonContent: {
//     width: '100%',
//     height: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });
import React, { useState, useEffect } from 'react';
import { View, Image, FlatList, TouchableOpacity, StyleSheet, Text, SafeAreaView, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import ThemedButton from '@/components/ThemeButton';
import { AntDesign } from '@expo/vector-icons';

const MAX_IMAGES = 4;

export default function CustomImagePicker() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const { assets } = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: 'photo'
        });
        setPhotos(assets);
      }
    })();
  }, []);

  const toggleSelection = (photo) => {
    setSelectedPhotos((prev) => {
      const index = prev.findIndex(p => p.id === photo.id);
      if (index > -1) {
        // Deselect
        const newSelection = prev.filter(p => p.id !== photo.id);
        return newSelection.map((p, i) => ({ ...p, order: i + 1 }));
      } else if (prev.length < MAX_IMAGES) {
        // Select
        return [...prev, { ...photo, order: prev.length + 1 }];
      }
      return prev;
    });
  };

  const handleNext = () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No images selected', 'Please select at least one image to continue.');
      return;
    }
    router.push({
      pathname: '/create-post/description-location',
      params: { images: JSON.stringify(selectedPhotos.map(img => img.uri)) }
    });
  };

  const renderPhoto = ({ item }) => {
    const isSelected = selectedPhotos.some(p => p.id === item.id);
    const selectedIndex = selectedPhotos.findIndex(p => p.id === item.id);

    return (
      <TouchableOpacity onPress={() => toggleSelection(item)} style={styles.photoContainer}>
        <Image source={{ uri: item.uri }} style={styles.photo} />
        {isSelected && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionText}>{selectedIndex + 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
      />
      <ThemedButton
        onPress={handleNext}
        type="default"
        size="large"
        style={styles.nextButton}
        disabled={selectedPhotos.length === 0}
      >
        <View style={styles.nextButtonContent}>
          <AntDesign name="arrowright" size={24} color="black" />
        </View>
      </ThemedButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  photoContainer: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 1,
  },
  photo: {
    flex: 1,
  },
  selectionBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
    padding: 0,
  },
  nextButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});