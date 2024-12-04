import { View, StyleSheet, ActivityIndicator, Animated, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useEffect, useRef } from 'react';
import Auth from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/ThemedText';

export default function App() {
  const { session, isLoading, error } = useAuth();

  // Animation for gradient transition
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  const backgroundColorInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F5F5F5', '#FFFFFF'],  // Subtle light gray to white transition
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('@/assets/images/TMH_Logo.png')}
          style={styles.logoSmall}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#666" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.errorText}>Error: {error.message}</ThemedText>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.outer, { backgroundColor: backgroundColorInterpolation }]}>
      <LinearGradient
        colors={['#F5F5F5', '#FFFFFF']}
        style={styles.gradientBackground}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/TMH_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.authContainer}>
          <Auth />
        </View>
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
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 200,
    height: 80,
  },
  logoSmall: {
    width: 150,
    height: 60,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
  },
});
