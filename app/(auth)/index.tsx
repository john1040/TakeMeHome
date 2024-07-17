import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Auth from '@/components/Auth'
import { View, Text, StyleSheet } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@rneui/themed'

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
      <Auth />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 50,
    marginTop: 50,
    padding: 12,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  }
})