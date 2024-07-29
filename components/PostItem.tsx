import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function PostItem({ post }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>{post.description}</Text>
      {post.image && post.image[0] && (
        <Image source={{ uri: post.image[0].url }} style={styles.image} />
      )}
      <Text style={styles.location}>{post.street_name}</Text>
      <Text style={styles.date}>{new Date(post.created_at).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  description: {
    fontSize: 16,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});