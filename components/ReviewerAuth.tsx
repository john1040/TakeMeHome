import React, { useState } from 'react';
import { Alert, StyleSheet, View, ActivityIndicator, TextInput } from 'react-native';
import { ThemedButton } from './ThemeButton';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { palette } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { isReviewerAccount } from '@/utils/reviewerAuth';

export default function ReviewerAuth() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signInWithPassword = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('Sign in error:', error);
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        console.log('User signed in successfully:', data.user.email);
        
        // Check if this is a reviewer account for bypass logic
        const isReviewer = isReviewerAccount(data.user.email || '');
        
        if (isReviewer) {
          console.log('Reviewer account detected, bypassing phone verification');
        }
        
        // Navigate directly to the main app
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Unexpected error during sign in:', error);
      setErrorMessage('An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {errorMessage && (
        <ThemedView style={styles.errorContainer} variant="surface">
          <ThemedText style={styles.errorText} type="caption">{errorMessage}</ThemedText>
        </ThemedView>
      )}

      <View style={styles.header}>
        <Ionicons name="lock-closed" size={48} color={palette.teal} style={styles.icon} />
        <ThemedText type="title" style={styles.title}>
          Sign In with Password
        </ThemedText>
        <ThemedText type="caption" style={styles.subtitle}>
          Enter your email and password to continue
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color={palette.teal} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            placeholder={t('auth.email')}
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
            placeholder={t('auth.password')}
            placeholderTextColor={palette.teal}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <ThemedButton
          type="primary"
          title={loading ? 'Signing in...' : t('auth.signIn')}
          disabled={loading}
          onPress={signInWithPassword}
          style={styles.signInButton}
        />
        
        {loading && (
          <ActivityIndicator
            size="small"
            color={palette.teal}
            style={styles.loadingIndicator}
          />
        )}
      </View>

      <View style={styles.infoContainer}>
        <ThemedText type="caption" style={styles.infoText}>
          Use your account credentials to access the application
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    margin: 16,
    shadowColor: palette.carbon,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: `${palette.gold}20`,
    borderWidth: 1,
    borderColor: palette.gold,
    borderRadius: 8,
  },
  errorText: {
    color: palette.gold,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    color: palette.deepTeal,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: palette.teal,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  signInButton: {
    width: '100%',
  },
  loadingIndicator: {
    marginTop: 8,
  },
  infoContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: `${palette.teal}20`,
  },
  infoText: {
    color: palette.teal,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});