import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { ThemedButton } from './ThemeButton';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { palette } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signInWithEmail() {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) setErrorMessage(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) setErrorMessage(error.message);
    if (!session && !error) Alert.alert('Please check your inbox for email verification!');
    setLoading(false);
  }

  async function signUpWithGoogle() {
    // Implement Google sign in
  }

  return (
    <ThemedView style={styles.container}>
      {errorMessage && (
        <ThemedView style={styles.errorContainer} variant="surface">
          <ThemedText style={styles.errorText} type="caption">{errorMessage}</ThemedText>
        </ThemedView>
      )}
      
      <View style={[styles.inputContainer, styles.mt20]}>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color={palette.teal} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            placeholder="Email"
            placeholderTextColor={palette.teal}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={palette.teal} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={palette.teal}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={[styles.buttonContainer, styles.mt20]}>
        <ThemedButton
          type="primary"
          title="Sign in"
          disabled={loading}
          onPress={signInWithEmail}
        />
      </View>

      <View style={styles.buttonContainer}>
        <ThemedButton
          type="secondary"
          variant="outlined"
          title="Sign up"
          disabled={loading}
          onPress={signUpWithEmail}
        />
      </View>

      <View style={[styles.buttonContainer, styles.mt20]}>
        <ThemedButton
          type="accent"
          title="Continue with Google"
          disabled={loading}
          onPress={signUpWithGoogle}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  errorContainer: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: `${palette.gold}20`,
    borderWidth: 1,
    borderColor: palette.gold,
  },
  errorText: {
    color: palette.gold,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.teal,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: `${palette.white}80`,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: palette.carbon,
    fontSize: 16,
    height: '100%',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  mt20: {
    marginTop: 20,
  },
});