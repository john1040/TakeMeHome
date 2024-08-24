import React, { useState, useEffect } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@rneui/themed'
import { useRouter } from 'expo-router'

// OTP expiration time in seconds (5 minutes)
const OTP_EXPIRATION_TIME = 5 * 60;

// Maximum number of OTP requests per hour
const MAX_OTP_REQUESTS_PER_HOUR = 5;

export default function PhoneVerification() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function getUserId() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        // If no user is found, redirect to login
        router.replace('/')
      }
    }
    getUserId()
  }, [])

  async function sendVerificationCode() {
    // ... (keep the existing sendVerificationCode function as is)
  }

  async function verifyPhoneNumber() {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.')
      return
    }

    setLoading(true)
    try {
      // Check if the OTP matches and is not expired
      const { data, error } = await supabase
        .from('phone_verification')
        .select()
        .eq('user_id', userId)
        .eq('phone', phone)
        .eq('otp', otp)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) throw new Error('Invalid or expired OTP')

      // If OTP is valid, update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: phone, phone_verified: true })
        .eq('id', userId)

      if (updateError) throw updateError

      // Delete all OTPs for this user
      await supabase
        .from('phone_verification')
        .delete()
        .eq('user_id', userId)

      // Check if the user has a username set
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      Alert.alert('Success', 'Phone number verified successfully')
      
      // Redirect based on whether the username is set
      if (profileData && profileData.username) {
        router.push('/profile') // Existing user with username, go to profile
      } else {
        router.push('/setup-profile') // New user or no username set, go to setup profile
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify phone number. Please try again.')
      console.error('Error verifying phone number:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.verticallySpaced}>
        <Input
          label="Phone Number"
          leftIcon={{ type: 'font-awesome', name: 'phone' }}
          onChangeText={setPhone}
          value={phone}
          placeholder="+1234567890"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Button 
          title="Send Verification Code" 
          disabled={loading || showOtpInput} 
          onPress={sendVerificationCode} 
        />
      </View>
      {showOtpInput && (
        <>
          <View style={styles.verticallySpaced}>
            <Input
              label="Verification Code"
              leftIcon={{ type: 'font-awesome', name: 'key' }}
              onChangeText={setOtp}
              value={otp}
              placeholder="Enter verification code"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Button 
              title="Verify Phone Number" 
              disabled={loading} 
              onPress={verifyPhoneNumber} 
            />
          </View>
        </>
      )}
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
})