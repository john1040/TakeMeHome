import { StyleSheet, ActivityIndicator, Animated, Image, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useEffect, useRef } from 'react';
import Auth from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { palette } from '@/constants/Colors';

export default function App() {
  const { session, isLoading, error } = useAuth();

  // Animation for gradient transition
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  const backgroundColorInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.teal, palette.deepTeal],
  });

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer} variant="surface">
        <Image 
          source={require('@/assets/images/TMH_Logo.png')}
          style={styles.logoSmall}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={palette.deepTeal} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container} variant="surface">
        <ThemedText type="heading" style={styles.errorTitle}>Oops!</ThemedText>
        <ThemedText style={styles.errorText}>
          Something went wrong: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <Animated.View style={[styles.outer, { backgroundColor: backgroundColorInterpolation }]}>
      <LinearGradient
        colors={[palette.sage, palette.deepTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <ThemedView variant="surface" style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/TMH_Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText type="title" style={styles.welcomeText}>
              Welcome Back
            </ThemedText>
            <ThemedText type="caption" style={styles.subtitleText}>
              Sign in to continue
            </ThemedText>
          </View>
          <View style={styles.authContainer}>
            <Auth />
          </View>
        </ThemedView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    marginTop: 40,
    shadowColor: palette.carbon,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 72,
    marginBottom: 24,
  },
  logoSmall: {
    width: 150,
    height: 60,
    marginBottom: 20,
  },
  welcomeText: {
    marginBottom: 8,
    color: palette.deepTeal,
  },
  subtitleText: {
    color: palette.teal,
    marginBottom: 16,
  },
  errorTitle: {
    color: palette.gold,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    color: palette.carbon,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
