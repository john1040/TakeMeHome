// import React, { useState, useEffect } from 'react';
// import { View, TextInput, Button, Image, Alert, StyleSheet } from 'react-native';
// import * as Location from 'expo-location';
// import { LocationObject } from 'expo-location';
// import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system';
// import NetInfo from '@react-native-community/netinfo';
// import { supabase } from '@/lib/supabase';
// import { useAuth } from '@/hooks/useAuth';
// const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co'
// export default function CreatePost() {
//     const { session, isLoading } = useAuth();
//   const [description, setDescription] = useState('');
//   const [image, setImage] = useState<string | null>(null);
//   const [location, setLocation] = useState<LocationObject | null>(null);

//   useEffect(() => {
//     (async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission to access location was denied');
//         return;
//       }

//       let location = await Location.getCurrentPositionAsync({});
//       setLocation(location);
//     })();
//   }, []);

//   const pickImage = async () => {
//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setImage(result.assets[0].uri);
//     }
//   };

  
// //   const handleSubmit = async () => {
// //     if (!description || !image || !location) {
// //       Alert.alert('Please fill in all fields and wait for location data');
// //       return;
// //     }

// //     try {
// //       // Read the file as base64
// //       const base64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
      
// //       // Convert base64 to ArrayBuffer
// //       const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

// //       const filename = image.split('/').pop();
// //       const fileExt = filename?.split('.').pop();
// //       console.log('A')
// //       // Upload the image
// //       const { data: imageData, error: imageError } = await supabase.storage
// //         .from('post-images')
// //         .upload(`${Date.now()}-${filename}`, arrayBuffer, {
// //           contentType: `image/${fileExt}`
// //         });
// //         console.log('B', imageData, imageError)
// //       if (imageError) {
// //         console.log('Image upload error:', imageError);
// //         throw imageError;
// //       }
      
// //       console.log('JOJO')
// //       const imageUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${imageData.path}`;

// //       // Create the post
// //       const { data, error } = await supabase
// //         .from('Post')
// //         .insert({
// //           user_id: session?.user.id, // Use the authenticated user's ID
// //           description: description,
// //           geolocation: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
// //         })
// //         .select();
        
// //       if (error) {
// //         console.log('meow', error)
// //         throw error
// //       }

// //       // Add the image to the Image table
// //       const { error: imageInsertError } = await supabase
// //         .from('Image')
// //         .insert({
// //           post_id: data[0].id,
// //           url: imageUrl,
// //         });

// //       if (imageInsertError) {
// //         console.log('image insert error')
// //         throw imageInsertError;
// //         }

// //       Alert.alert('Post created successfully!');
// //       setDescription('');
// //       setImage(null);
// //     } catch (error) {
// //       console.error('Error creating post:', error);
// //       Alert.alert('Error creating post: ' + (error as Error).message);
// //     }
// //   };
// const handleSubmit = async () => {
//     if (!description || !image || !location) {
//       Alert.alert('Please fill in all fields and wait for location data');
//       return;
//     }

//     try {
//       // Check network connectivity
//       const netInfo = await NetInfo.fetch();
//       if (!netInfo.isConnected) {
//         throw new Error('No internet connection');
//       }

//       console.log('Starting image upload process...');

//       // Get file info
//       const fileInfo = await FileSystem.getInfoAsync(image);
//       console.log('File info:', fileInfo);

//       // Check file size (limit to 5MB for example)
//       console.log(fileInfo.size)
//       if (fileInfo.size > 5 * 1024 * 1024) {
//         throw new Error('File size exceeds 5MB limit');
//       }

//       // Read the file as base64
//       console.log('Reading file as base64...');
//       const base64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
//       console.log('File read successfully. Base64 length:', base64.length);
      
//       // Convert base64 to ArrayBuffer
//       console.log('Converting base64 to ArrayBuffer...');
//       const arrayBuffer = new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0))).buffer;
//       console.log('ArrayBuffer created. Size:', arrayBuffer.byteLength);

//       const filename = image.split('/').pop();
//       const fileExt = filename.split('.').pop();
      
//       // Upload the image
//       console.log('Uploading image to Supabase...');
//       const { data: imageData, error: imageError } = await supabase.storage
//         .from('post-images')
//         .upload(`${Date.now()}-${filename}`, arrayBuffer, {
//           contentType: `image/${fileExt}`
//         });

//       if (imageError) {
//         console.error('Image upload error:', imageError);
//         throw imageError;
//       }
      
//       console.log('Image uploaded successfully. Path:', imageData.path);
//       const imageUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${imageData.path}`;

//       // Create the post
//       console.log('Creating post...');
//       const { data, error } = await supabase
//         .from('Post')
//         .insert({
//           user_id: session?.user.id,
//           description: description,
//           geolocation: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
//         })
//         .select();
        
//       if (error) {
//         console.error('Error creating post:', error);
//         throw error;
//       }

//       console.log('Post created successfully. ID:', data[0].id);

//       // Add the image to the Image table
//       console.log('Adding image to Image table...');
//       const { error: imageInsertError } = await supabase
//         .from('Image')
//         .insert({
//           post_id: data[0].id,
//           url: imageUrl,
//         });

//       if (imageInsertError) {
//         console.error('Error inserting image:', imageInsertError);
//         throw imageInsertError;
//       }

//       console.log('Image added to Image table successfully');

//       Alert.alert('Post created successfully!');
//       setDescription('');
//       setImage(null);
//     } catch (error) {
//       console.error('Error in handleSubmit:', error);
//       Alert.alert('Error creating post: ' + (error as Error).message);
//     }
//   };
//   return (
//     <View style={styles.container}>
//       <TextInput
//         style={styles.input}
//         value={description}
//         onChangeText={setDescription}
//         placeholder="What's on your mind?"
//         multiline
//       />
//       <Button title="Pick an image" onPress={pickImage} />
//       {image && <Image source={{ uri: image }} style={styles.image} />}
//       <Button title="Create Post" onPress={handleSubmit} />
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
//   image: {
//     width: 200,
//     height: 200,
//     resizeMode: 'contain',
//     marginTop: 20,
//   },
// });
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Image, Alert, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co'

export default function CreatePost() {
  const { session, userProfile, isLoading } = useAuth();

  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

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
      console.log('Creating post...');
      const { data, error: databaseError } = await supabase
        .from('post')
        .insert({
          user_id: userProfile?.id,
          description: description,
          geolocation: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
        })
        .select();

      if (databaseError) {
        console.error('Error creating post:', databaseError);
        throw databaseError;
      }

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
      <Button title="Create Post" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
});