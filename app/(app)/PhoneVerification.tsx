import React, { useState, useEffect, useRef } from 'react'
import { Alert, StyleSheet, View, Text, TextInput } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@rneui/themed'
import { Picker } from '@react-native-picker/picker'
import { useRouter } from 'expo-router'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'

// OTP expiration time in seconds (5 minutes)
const OTP_EXPIRATION_TIME = 5 * 60;

// Maximum number of OTP requests per hour
const MAX_OTP_REQUESTS_PER_HOUR = 5;

const countryCodeOptions = [
  { label: 'Taiwan (+886)', value: '+886' },
  { label: 'USA/Canada (+1)', value: '+1' },
];

export default function PhoneVerification() {
    const [countryCode, setCountryCode] = useState('+886')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()

    const otpInputs = useRef<Array<TextInput | null>>([])
  
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
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.')
      return
    }

    setLoading(true)
    try {
      // Check rate limiting
      const { count, error: countError } = await supabase
        .from('phone_verification')
        .select('created_at', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())

      if (countError) throw countError

      if (count && count >= MAX_OTP_REQUESTS_PER_HOUR) {
        throw new Error('Too many OTP requests. Please try again later.')
      }

      // Generate a random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

      const fullPhoneNumber = `${countryCode}${phoneNumber}`

      // Store the OTP in the database
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

      setShowOtpInput(true)
      Alert.alert('Success', 'Please check your phone for the verification code')
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
  
        // Check if the phone number is already registered
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
  
        // Check rate limiting
        const { count, error: countError } = await supabase
          .from('phone_verification')
          .select('created_at', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 3600000).toISOString())
  
        if (countError) throw countError
  
        if (count && count >= MAX_OTP_REQUESTS_PER_HOUR) {
          throw new Error('Too many OTP requests. Please try again later.')
        }
  
        // Generate a random 6-digit OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
  
        // Store the OTP in the database
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
          throw new Error('Failed to send SMS');
        }
  
        setShowOtpInput(true)
        Alert.alert('Success', 'Please check your phone for the verification code')
      } catch (error) {
        Alert.alert('Error', 'Failed to send verification code. Please try again.')
        console.error('Error sending verification code:', error)
      } finally {
        setLoading(false)
      }
    }
  

  return (
    <View style={styles.container}>
        <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">請讓我們確認你是人類</ThemedText>
      </ThemedView>
      <View style={styles.phoneInputContainer}>
        <View style={styles.countryCodePicker}>
          <Picker
            selectedValue={countryCode}
            onValueChange={(itemValue) => setCountryCode(itemValue)}
          >
            {countryCodeOptions.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
        <View style={styles.phoneNumberInputContainer}>
          <View style={styles.countryCodeContainer}>
            <Text style={styles.countryCodeText}>{countryCode}</Text>
          </View>
          <View style={styles.phoneNumberInputWrapper}>
            <Input
              containerStyle={styles.phoneNumberInput}
              inputContainerStyle={styles.phoneNumberInputInner}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              onChangeText={setPhoneNumber}
              value={phoneNumber}
            />
          </View>
        </View>
      </View>
      <View style={styles.verticallySpaced}>
        <Button 
          title="傳送驗證碼" 
          disabled={loading || showOtpInput} 
          onPress={sendVerificationCode}
        />
      </View>
      {showOtpInput && (
        <>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={styles.otpInput}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                keyboardType="numeric"
                maxLength={1}
                ref={(input) => otpInputs.current[index] = input}
              />
            ))}
          </View>
          <View style={styles.verticallySpaced}>
            <Button 
              title="Verify Phone Number" 
              disabled={loading || otp.some(digit => digit === '')} 
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
      flex: 1,
      padding: 30,
      justifyContent: 'center',
    },
    phoneInputContainer: {
      flexDirection: 'column',
      marginBottom: 20,
    },
    countryCodePicker: {
      marginBottom: 0,
      borderColor: '#86939e',
      borderRadius: 5,
    },
    phoneNumberInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
    },
    countryCodeContainer: {
      width: 60,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    //   backgroundColor: '#e1e8ee',
      borderTopLeftRadius: 5,
      borderBottomLeftRadius: 5,
      marginBottom: 27
    },
    countryCodeText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    phoneNumberInputWrapper: {
      flex: 1,
    },
    phoneNumberInput: {
      paddingHorizontal: 3,
    },
    phoneNumberInputInner: {
      borderBottomWidth: 1,
    },
    verticallySpaced: {
      paddingTop: 4,
      paddingBottom: 4,
      alignSelf: 'stretch',
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
        
      },
      otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
      },
      otpInput: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: '#86939e',
        borderRadius: 5,
        textAlign: 'center',
        fontSize: 18,
      },
  })