import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import * as AppleAuthentication from 'expo-apple-authentication'
import React from 'react'
import { Alert, StyleSheet, View, Platform } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import CustomGoogleSignInButton from './CustomGoogleSignInButton'
import { useTranslation } from '@/hooks/useTranslation'
import { updateProfileWithAvatar, isValidImageUrl } from '@/utils/profileUtils'

export default function Auth() {
  const { t } = useTranslation();
  const router = useRouter();

  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    webClientId: '979781725310-827r3gjqhj49bstcln2r7sj280d359rd.apps.googleusercontent.com',
    iosClientId: '979781725310-7gn3d2lqf7rhsqk492gcv7otb58midre.apps.googleusercontent.com'
  })

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()

      if (userInfo.idToken && userInfo.user && userInfo.user.email) {
        const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.idToken,
        })

        if (authError) {
          console.error('Error signing in with Google:', authError)
          Alert.alert(t('common.error'), t('auth.failedToSignInWithGoogle'))
          return
        }

        console.log('Signed in with Google:', authData)

        // Check if the user already has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, phone_verified, avatar_url')
          .eq('email', userInfo.user.email)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError)
          Alert.alert(t('common.error'), t('auth.failedToFetchUserProfile'))
          return
        }

        // Update or create profile with avatar URL if available
        if (userInfo.user.photo && userInfo.user.email && isValidImageUrl(userInfo.user.photo)) {
          const result = await updateProfileWithAvatar(
            userInfo.user.email,
            userInfo.user.photo,
            profileData?.username
          );
          
          if (!result.success) {
            console.error('Error updating profile with avatar:', result.error);
          }
        }

        if (!profileData || !profileData.username) {
          console.log('New user, redirecting to phone verification')
          router.replace('/PhoneVerification')
        } else if (!profileData.phone_verified) {
          console.log('Existing user, phone not verified, redirecting to phone verification')
          router.replace('/PhoneVerification')
        } else {
          console.log('Existing user with verified phone, redirecting to profile')
          router.replace('/profile')
        }
      } else {
        throw new Error('No ID token present!')
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Sign in cancelled')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in already in progress')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(t('common.error'), t('auth.playServicesNotAvailable'))
      } else {
        console.error('Unexpected error during Google sign in:', error)
        Alert.alert(t('common.error'), t('auth.unexpectedErrorOccurred'))
      }
    }
  }

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (credential.identityToken) {
        const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        })

        if (authError) {
          console.error('Error signing in with Apple:', authError)
          Alert.alert(t('common.error'), t('auth.failedToSignInWithApple'))
          return
        }

        console.log('Signed in with Apple:', authData)

        // Extract email from credential or auth data
        const email = credential.email || authData.user?.email

        if (!email) {
          Alert.alert(t('common.error'), t('auth.unableToRetrieveEmailFromApple'))
          return
        }

        // Check if the user already has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, phone_verified, avatar_url')
          .eq('email', email)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError)
          Alert.alert(t('common.error'), t('auth.failedToFetchUserProfile'))
          return
        }

        // For Apple, we don't get the photo URL from the credential, but we can check if user has one
        // Apple doesn't provide avatar URLs, so we'll handle this differently if needed
        // You could implement a placeholder or ask user to upload their own photo

        if (!profileData || !profileData.username) {
          console.log('New user, redirecting to phone verification')
          router.replace('/PhoneVerification')
        } else if (!profileData.phone_verified) {
          console.log('Existing user, phone not verified, redirecting to phone verification')
          router.replace('/PhoneVerification')
        } else {
          console.log('Existing user with verified phone, redirecting to profile')
          router.replace('/profile')
        }
      } else {
        throw new Error('No identity token present!')
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple Sign in cancelled')
      } else {
        console.error('Unexpected error during Apple sign in:', error)
        Alert.alert(t('common.error'), t('auth.unexpectedErrorOccurred'))
      }
    }
  }

  return (
    <View style={styles.container}>
      <CustomGoogleSignInButton onPress={handleGoogleSignIn} />
      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
          cornerRadius={4}
          style={styles.appleButton}
          onPress={handleAppleSignIn}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
    alignItems: 'center',
  },
  appleButton: {
    width: 240,
    height: 44,
    marginTop: 16,
  },
})