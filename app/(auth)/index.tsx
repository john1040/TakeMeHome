import { StyleSheet, ActivityIndicator, Animated, Image, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useEffect, useRef } from 'react';
import Auth from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { palette } from '@/constants/Colors';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@rneui/themed';
import { useRouter } from 'expo-router';

export default function App() {
  const { session, isLoading, error } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const navigateToPhoneVerification = () => {
    router.push('/PhoneVerification');
  };

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
        <ThemedText type="heading" style={styles.errorTitle}>{t('auth.oops')}</ThemedText>
        <ThemedText style={styles.errorText}>
          {error.message}
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
              {t('auth.welcomeBack')}
            </ThemedText>
            <ThemedText type="caption" style={styles.subtitleText}>
              {t('auth.signInToContinue')}
            </ThemedText>
          </View>
          <View style={styles.authContainer}>
            <Auth />
            {isDevelopment && (
              <Button
                title="🧪 Test Phone Verification"
                onPress={navigateToPhoneVerification}
                buttonStyle={styles.devButton}
                titleStyle={styles.devButtonText}
              />
            )}
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
    backgroundColor: '#ffffff',
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
  devButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
