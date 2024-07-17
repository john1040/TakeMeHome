import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Auth from '@/components/Auth'
import { View, Text, StyleSheet } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@rneui/themed'
import { router } from 'expo-router'

export default function App() {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View>
        <Text>loading...</Text>
      </View>
    )
  }
  return (
    <View style={styles.container}>
      {session && session.user && <Text>{session.user.email}</Text>}
      {/* <Auth />
      {session && session.user && <Text>{session.user.email}</Text>} */}
      <Text>index page</Text>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})