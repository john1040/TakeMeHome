# TakeMeHome App Setup Guide

This document provides instructions for setting up and running the TakeMeHome application for both iOS and Android platforms.

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js (LTS version)
- Git
- Xcode (for iOS development)
- Android Studio (for Android development)
- Expo CLI: `npm install -g expo-cli`
- CocoaPods (for iOS): `sudo gem install cocoapods`

## Project Setup

1. Clone the repository and install dependencies:
```bash
git clone [repository-url]
cd TakeMeHome
npm install
```

## Backend Setup (Supabase)

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Create the following tables with their respective schemas:

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  username TEXT,
  phone TEXT,
  phone_verified BOOLEAN
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  title TEXT,
  description TEXT,
  category TEXT,
  geolocation GEOGRAPHY,
  street_name TEXT
);
```

4. Update Supabase configuration in `lib/supabase.ts` with your project's URL and keys

## iOS Setup

1. Install iOS dependencies:
```bash
cd ios
pod install
cd ..
```

2. Open Xcode workspace:
```bash
open ios/TakeMeHome.xcworkspace
```

3. Update bundle identifier in Xcode (currently set to `com.yourcompany.tmhapp`)
4. Configure signing certificates in Xcode
5. Configure required permissions in Info.plist (most are already configured in project):
   - Location permissions (NSLocationWhenInUseUsageDescription)
   - Camera permissions (NSCameraUsageDescription)
   - Photo Library permissions (NSPhotoLibraryUsageDescription)
   - Media Library permissions (NSMediaLibraryUsageDescription)

Additional iOS capabilities that need to be enabled in Xcode:
   - Maps
   - Push Notifications
   - Camera
   - Location Services

## Android Setup

1. Open Android Studio with the `android` folder
2. Update `android/app/build.gradle` package name if needed (currently set to `com.yourcompany.tmhapp`)
3. Ensure required permissions are properly configured in `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```

4. Create a debug keystore (if not exists):
   ```bash
   cd android/app
   keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
   ```

5. Configure Google Play Services in Android Studio:
   - Open the SDK Manager
   - Install Google Play services from the SDK Tools tab
   - Ensure Google Maps API is enabled in your Google Cloud Console

## Google Sign-In Configuration

1. Set up a Google Cloud Project at https://console.cloud.google.com/
2. Configure OAuth 2.0 credentials:
   - Create credentials for iOS and Android platforms
   - For iOS, use bundle ID: `com.yourcompany.tmhapp`
   - For Android, use package name: `com.yourcompany.tmhapp`

3. For iOS:
   - Add URL scheme in Xcode: `com.googleusercontent.apps.[YOUR-CLIENT-ID]`
   - Update `app.json` with your iOS client ID in the plugins section:
   ```json
   "plugins": [
     ["@react-native-google-signin/google-signin", {
       "iosUrlScheme": "com.googleusercontent.apps.[YOUR-CLIENT-ID]"
     }]
   ]
   ```

4. For Android:
   - Generate SHA-1 fingerprint using keytool:
   ```bash
   cd android/app
   keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   - Add the SHA-1 fingerprint to Google Cloud Console
   - Download `google-services.json` from Google Cloud Console
   - Place it in `android/app/google-services.json`

## Environment Configuration

The application uses Supabase for backend services and Google Sign-In for authentication. Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url                # Found in Supabase Project Settings -> API
SUPABASE_ANON_KEY=your_anon_key              # Found in Supabase Project Settings -> API -> anon/public key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Found in Supabase Project Settings -> API -> service_role key

# Google Sign-In (from Google Cloud Console -> APIs & Services -> Credentials)
GOOGLE_WEB_CLIENT_ID=your_web_client_id          # OAuth 2.0 Client ID for Web application
GOOGLE_IOS_CLIENT_ID=your_ios_client_id          # OAuth 2.0 Client ID for iOS application
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id   # OAuth 2.0 Client ID for Android application
```

Make sure to:
1. Add `.env` to your `.gitignore` file to keep sensitive information secure
2. Keep a backup of these credentials in a secure location
3. Use different credentials for development and production environments

## Running the Application

1. Start the development server:
```bash
npm start
```

2. Run on iOS:
```bash
npm run ios
```

3. Run on Android:
```bash
npm run android
```

## Verifying the Setup

After completing all setup steps, verify that everything is working correctly:

1. Test Authentication:
   ```bash
   npm start
   ```
   - Open the app and try signing in with Google
   - Verify that user profile information appears after sign-in

2. Test Core Features:
   - Location services are working (map shows current location)
   - Camera access is functioning
   - Image upload and preview is working
   - Posts are being saved to Supabase

3. Run the test suite:
   ```bash
   npm test
   ```

## Troubleshooting

Common issues and their solutions:

1. Pod install fails:
   - Try cleaning the pod cache: `pod cache clean --all`
   - Delete Podfile.lock and try again

2. Android build fails:
   - Clean the gradle build: `cd android && ./gradlew clean`
   - Ensure all SDK platforms are installed in Android Studio

3. Google Sign-In issues:
   - Verify URL schemes in Info.plist
   - Check SHA-1 fingerprint in Google Cloud Console
   - Ensure client IDs are correct in configuration

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Sign-In Setup Guide](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [React Native Maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [Expo Image Picker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Query Documentation](https://tanstack.com/query/latest) (Used for data fetching)

For any additional support, please contact the development team.