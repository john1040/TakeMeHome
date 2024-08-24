import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nkkaxelmylemiesxvmoz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ra2F4ZWxteWxlbWllc3h2bW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA0NDUzMjQsImV4cCI6MjAzNjAyMTMyNH0.ATsPbSxQFdtoEzEkNsqeNE885Op-RNOO5sWyUw8XP-4'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ra2F4ZWxteWxlbWllc3h2bW96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMDQ0NTMyNCwiZXhwIjoyMDM2MDIxMzI0fQ.OvzPV1ulJBlQVo7JQrNKQowpudLUVa096Z9euhkMaMY'
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})