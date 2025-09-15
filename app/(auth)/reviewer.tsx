import { StyleSheet, View, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ReviewerAuth from '@/components/ReviewerAuth';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { palette } from '@/constants/Colors';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ThemeButton';

export default function ReviewerScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={[palette.sage, palette.deepTeal]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <ThemedView variant="surface" style={styles.contentContainer}>
        <View style={styles.header}>
          <ThemedButton
            type="secondary"
            variant="outlined"
            title="← Back to Login"
            onPress={goBack}
            style={styles.backButton}
          />
        </View>

        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/TMH_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.welcomeText}>
            TakeMeHome
          </ThemedText>
          <ThemedText type="caption" style={styles.subtitleText}>
            App Store Review Access
          </ThemedText>
        </View>

        <ReviewerAuth />

        <View style={styles.footer}>
          <ThemedText type="caption" style={styles.footerText}>
            For App Store review purposes only
          </ThemedText>
        </View>
      </ThemedView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: palette.carbon,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 48,
    marginBottom: 16,
  },
  welcomeText: {
    marginBottom: 8,
    color: palette.deepTeal,
  },
  subtitleText: {
    color: palette.teal,
    marginBottom: 16,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: `${palette.teal}20`,
    alignItems: 'center',
  },
  footerText: {
    color: palette.teal,
    fontStyle: 'italic',
  },
});