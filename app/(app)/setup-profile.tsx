import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SetupProfile() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (error) throw error;
      console.log('meow')
      router.replace('/profile');
    } catch (error) {
      console.error('Error setting username:', error);
      setError('Failed to set username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter your username"
        editable={!isLoading}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button
        title={isLoading ? "Submitting..." : "Submit"}
        onPress={handleSubmit}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});