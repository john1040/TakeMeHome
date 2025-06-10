import React, { useState, useEffect, useRef } from 'react'
import { Alert, StyleSheet, View, Text, TextInput, Dimensions, Platform, TouchableOpacity, ActionSheetIOS } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@rneui/themed'
import { useRouter } from 'expo-router'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import Constants from 'expo-constants'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { Stack } from 'expo-router'

// Development mode flag - set this to true during development
const isDevelopment = process.env.NODE_ENV === 'development'

// Mock user ID for development
const MOCK_USER_ID = 'dev-user-123'

// OTP expiration time in seconds (5 minutes)
const OTP_EXPIRATION_TIME = 5 * 60;

// Maximum number of OTP requests per hour
const MAX_OTP_REQUESTS_PER_HOUR = 5;

const countryCodeOptions = [
  { label: 'Taiwan (+886)', value: '+886', flag: '🇹🇼' },
  { label: 'USA/Canada (+1)', value: '+1', flag: '🇺🇸' },
];

export default function PhoneVerification() {
    const [countryCode, setCountryCode] = useState('+886')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const screenWidth = Dimensions.get('window').width
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme ?? 'light']

    const otpInputs = useRef<Array<TextInput | null>>([])

    const showCountryPicker = () => {
      const options = countryCodeOptions.map(option => option.label)
      
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', ...options],
            cancelButtonIndex: 0,
            title: 'Select Country Code'
          },
          (buttonIndex) => {
            if (buttonIndex > 0) {
              const selectedOption = countryCodeOptions[buttonIndex - 1]
              setCountryCode(selectedOption.value)
            }
          }
        )
      } else {
        Alert.alert(
          'Select Country Code',
          '',
          [
            { text: 'Cancel', style: 'cancel' },
            ...countryCodeOptions.map(option => ({
              text: option.label,
              onPress: () => setCountryCode(option.value)
            }))
          ]
        )
      }
    }

    const getSelectedCountryLabel = () => {
      const selected = countryCodeOptions.find(option => option.value === countryCode)
      return selected ? `${selected.flag} ${selected.value}` : countryCode
    }
  
    useEffect(() => {
      async function getUserId() {
        if (isDevelopment) {
          // In development mode, use mock user ID
          setUserId(MOCK_USER_ID)
          return
        }

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
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.')
      return
    }

    setLoading(true)
    try {
      if (!isDevelopment) {
        // Skip rate limiting check in development mode
        const { count, error: countError } = await supabase
          .from('phone_verification')
          .select('created_at', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 3600000).toISOString())

        if (countError) throw countError

        if (count && count >= MAX_OTP_REQUESTS_PER_HOUR) {
          throw new Error('Too many OTP requests. Please try again later.')
        }
      }

      // Generate a random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

      const fullPhoneNumber = `${countryCode}${phoneNumber}`

      if (!isDevelopment) {
        // Skip database operations in development mode
        const { error } = await supabase
          .from('phone_verification')
          .insert({ 
            user_id: userId, 
            phone: fullPhoneNumber, 
            otp: generatedOtp, 
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + OTP_EXPIRATION_TIME * 1000).toISOString()
          })

        if (error) throw error

        // Call your Vercel backend API to send the OTP via SMS
        const response = await fetch('https://take-me-home-backend.vercel.app/api/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: fullPhoneNumber,
            message: `Your verification code is: ${generatedOtp}`,
          }),
        });

        if (!response.ok) {
          console.log(response)
          throw new Error('Failed to send SMS');
        }
      } else {
        // In development mode, log the OTP to the console
        console.log('Development Mode - OTP:', generatedOtp)
      }

      setShowOtpInput(true)
      Alert.alert('Success', isDevelopment 
        ? `Development Mode - Your OTP is: ${generatedOtp}` 
        : 'Please check your phone for the verification code'
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.')
      console.error('Error sending verification code:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp]
    newOtp[index] = text
    setOtp(newOtp)

    if (text.length === 1 && index < 5) {
      otpInputs.current[index + 1]?.focus()
    }
  }

  async function verifyPhoneNumber() {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.')
      return
    }

    setLoading(true)
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`
      const enteredOtp = otp.join('')

      if (!isDevelopment) {
        // Skip these checks in development mode
        const { data: existingUser, error: existingUserError } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', fullPhoneNumber)
          .single()

        if (existingUserError && existingUserError.code !== 'PGRST116') {
          throw existingUserError
        }

        if (existingUser) {
          Alert.alert('Error', 'This phone number is already registered with another account. Please use a different number.')
          setLoading(false)
          return
        }

        // Get the latest OTP record for this user
        const { data: otpRecord, error: otpError } = await supabase
          .from('phone_verification')
          .select('*')
          .eq('user_id', userId)
          .eq('phone', fullPhoneNumber)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (otpError) {
          throw new Error('Failed to retrieve OTP record')
        }

        if (!otpRecord) {
          throw new Error('No OTP record found')
        }

        // Check if OTP has expired
        const expiryTime = new Date(otpRecord.expires_at)
        if (expiryTime < new Date()) {
          throw new Error('OTP has expired. Please request a new one.')
        }

        // Verify OTP
        if (otpRecord.otp !== enteredOtp) {
          throw new Error('Invalid OTP. Please try again.')
        }

        // Update user profile with verified phone number
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            phone: fullPhoneNumber,
            phone_verified: true,
            updated_at: new Date().toISOString()
          })

        if (updateError) {
          throw updateError
        }

        // Delete used OTP record
        await supabase
          .from('phone_verification')
          .delete()
          .eq('id', otpRecord.id)
      } else {
        // In development mode, just simulate a successful verification
        console.log('Development Mode - Phone verification successful')
        await new Promise(resolve => setTimeout(resolve, 500)) // Add a small delay to simulate API call
      }

      Alert.alert('Success', 'Phone number verified successfully!')
      router.replace('/profile')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify phone number. Please try again.')
      console.error('Error verifying phone number:', error)
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            <Text style={[styles.backButtonText, { color: theme.text }]}>返回</Text>
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <ThemedText type="title" style={styles.title}>驗證手機號碼</ThemedText>
            <ThemedText type="default" style={styles.subtitle}>
              我們將發送驗證碼到您的手機
            </ThemedText>
          </View>

        {/* Phone Input Section */}
        <View style={styles.phoneSection}>
          <View style={styles.phoneInputContainer}>
            <TouchableOpacity
              style={[styles.countryCodeContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={showCountryPicker}
              activeOpacity={0.7}
            >
              <Text style={[styles.countryCodeText, { color: theme.text }]}>
                {getSelectedCountryLabel()}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={theme.icon} />
            </TouchableOpacity>
            <View style={styles.phoneNumberInputWrapper}>
              <Input
                placeholder="手機號碼"
                placeholderTextColor={theme.disabled}
                keyboardType="phone-pad"
                onChangeText={setPhoneNumber}
                value={phoneNumber}
                containerStyle={styles.phoneNumberInput}
                inputContainerStyle={[styles.phoneNumberInputInner, {
                  borderColor: theme.border,
                  backgroundColor: theme.surface
                }]}
                inputStyle={{ color: theme.text }}
                leftIcon={
                  <MaterialIcons name="phone" size={24} color={theme.icon} />
                }
              />
            </View>
          </View>

          <Button
            title={showOtpInput ? "重新發送驗證碼" : "發送驗證碼"}
            disabled={loading || !phoneNumber}
            onPress={sendVerificationCode}
            buttonStyle={[styles.sendButton, { backgroundColor: theme.primary }]}
            disabledStyle={[styles.disabledButton, { backgroundColor: theme.disabled }]}
            titleStyle={[styles.buttonText, { color: theme.background }]}
            loading={loading}
            loadingProps={{ color: theme.background }}
          />
        </View>

        {/* OTP Input Section */}
        {showOtpInput && (
          <View style={styles.otpSection}>
            <ThemedText type="default" style={[styles.otpInstructions, { color: theme.text }]}>
              請輸入驗證碼
            </ThemedText>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[
                    styles.otpInput,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      color: theme.text
                    },
                    digit ? [styles.otpInputFilled, {
                      borderColor: theme.primary,
                      backgroundColor: theme.background
                    }] : null,
                    otpInputs.current[index]?.isFocused() ? [styles.otpInputFocused, {
                      borderColor: theme.accent,
                      backgroundColor: theme.background
                    }] : null
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  ref={(input) => otpInputs.current[index] = input}
                  onFocus={() => {
                    if (digit === '' && index > 0 && otp[index - 1] === '') {
                      otpInputs.current[index - 1]?.focus()
                    }
                  }}
                />
              ))}
            </View>

            <Button
              title="確認驗證碼"
              disabled={loading || otp.some(digit => digit === '')}
              onPress={verifyPhoneNumber}
              buttonStyle={[styles.verifyButton, { backgroundColor: theme.accent }]}
              disabledStyle={[styles.disabledButton, { backgroundColor: theme.disabled }]}
              titleStyle={[styles.buttonText, { color: theme.background }]}
              loading={loading}
              loadingProps={{ color: theme.background }}
            />
          </View>
        )}
        </View>
      </ThemedView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  headerSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  phoneSection: {
    marginBottom: 48,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  countryCodeContainer: {
    width: 150,
    height: 50,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  phoneNumberInputWrapper: {
    flex: 1,
  },
  phoneNumberInput: {
    paddingHorizontal: 0,
  },
  phoneNumberInputInner: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  sendButton: {
    borderRadius: 12,
    height: 50,
  },
  verifyButton: {
    borderRadius: 12,
    height: 50,
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  otpSection: {
    alignItems: 'center',
    marginTop: 32,
  },
  otpInstructions: {
    fontSize: 16,
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  otpInputFilled: {
    borderWidth: 2,
  },
  otpInputFocused: {
    borderWidth: 3,
  },
});