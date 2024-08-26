import 'react-native-url-polyfill/auto'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import Auth from '@/components/Auth'
import { useAuth } from '@/hooks/useAuth'
import { ThemedText } from '@/components/ThemedText'

export default function App() {
  const { session, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.errorText}>Error: {error.message}</ThemedText>
      </View>
    )
  }

  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        <ThemedText type="title">Take Me Home 🏡</ThemedText>
      </View>
      <View style={styles.container}>
        <Auth />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    flexDirection: 'column',
    marginBottom: 50,
    marginTop: 50,
    padding: 12,
    justifyContent: 'space-around'
  },
  container: {
    marginBottom: 50,
    marginTop: 50,
    padding: 12,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  }
})