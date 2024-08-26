import React, { useCallback } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreatePostIndex() {
  const router = useRouter();

  const startNewPost = useCallback(() => {
    router.push('/create-post/image-selection');
  }, [router]);

  return (
    <View style={styles.container}>
      <Button 
        title="Start New Post" 
        onPress={startNewPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});