import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export default function SetupProfile() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, isLoading } = useAuth();
  const updateProfileMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      // const { data: { user } } = await supabase.auth.getUser();

      if (!session || !session.user) throw new Error('No user found');
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ username: newUsername, email: session.user.email })
        .select();
      console.log('data', data)
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      router.replace('/profile');
    },
    onError: (error) => {
      console.error('Error setting username:', error);
      setError('Failed to set username. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    setError('');
    updateProfileMutation.mutate(username);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter your username"
        editable={!updateProfileMutation.isPending}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {updateProfileMutation.isError ? (
        <Text style={styles.errorText}>{updateProfileMutation.error.message}</Text>
      ) : null}
      <Button
        title={updateProfileMutation.isPending ? "Submitting..." : "Submit"}
        onPress={handleSubmit}
        disabled={updateProfileMutation.isPending}
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