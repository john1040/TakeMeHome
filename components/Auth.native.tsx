import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import React, { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Redirect, useRouter } from 'expo-router'
import { Button } from '@rneui/themed'

export default function () {
  const router = useRouter();
  const signOut = async () => {
    GoogleSignin.revokeAccess();
    GoogleSignin.signOut();
    router.replace("/");
  };
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    webClientId: '979781725310-827r3gjqhj49bstcln2r7sj280d359rd.apps.googleusercontent.com',
    iosClientId: '979781725310-7gn3d2lqf7rhsqk492gcv7otb58midre.apps.googleusercontent.com'
  })

  return (
    <View style={styles.container}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={async () => {
          try {
            await GoogleSignin.hasPlayServices()
            const userInfo = await GoogleSignin.signIn()
            // console.log(userInfo)
            if (userInfo.idToken && userInfo.user && userInfo.user.email) {
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: userInfo.idToken,
              })

              console.log(userInfo.user.email)
let { data: profileData, error: thiserr} = await supabase
.from('profiles').select('username').eq('email', userInfo.user.email).single()
                console.log(profileData)
                console.log(thiserr)
                const a = JSON.stringify(profileData)
                console.log(a)
//               const { profileData, err } = await supabase.from('profiles').select().eq('email', userInfo.user.email)
              
              if (profileData?.username !== null) {
                router.replace('/profile')
              } else {
                console.log('user is new')
        
        
                router.replace('/setup-profile')
              }
            } else {
              throw new Error('no ID token present!')
            }
          } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
              // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
              // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
              // play services not available or outdated
            } else {
              // some other error happened
            }
          }
        }}
      />
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