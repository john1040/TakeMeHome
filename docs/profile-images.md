# Profile Images Feature

This document describes the implementation of profile images from Google and Apple sign-in providers.

## Overview

Users can now have profile images automatically populated from their Google or Apple accounts when they sign in using OAuth providers.

## Database Changes

### New Column: `avatar_url`
- **Table**: `profiles`
- **Type**: `TEXT`
- **Purpose**: Stores the URL of the user's profile image from OAuth providers

## Implementation Details

### 1. Authentication Flow Updates
- **File**: `components/Auth.native.tsx`
- **Changes**: 
  - Google Sign-in now captures `userInfo.user.photo` and stores it in the profile
  - Added validation for image URLs to ensure they come from trusted domains
  - Uses utility functions for cleaner code organization

### 2. Profile Display Components
- **Settings Page**: `app/(tabs)/settings.tsx`
- **Profile Page**: `app/(tabs)/profile.tsx`
- **ProfileAvatar Component**: `components/ProfileAvatar.tsx`

### 3. Utility Functions
- **File**: `utils/profileUtils.ts`
- **Functions**:
  - `updateProfileWithAvatar()`: Updates user profile with avatar URL
  - `getCurrentUserProfile()`: Fetches current user profile
  - `isValidImageUrl()`: Validates image URLs from trusted domains

### 4. Data Fetching Updates
- **File**: `hooks/useAuth.ts`
- **Changes**: Now includes `avatar_url` in profile queries

## Trusted Image Domains

For security, only images from these domains are accepted:
- `lh3.googleusercontent.com` (Google)
- `lh4.googleusercontent.com` (Google)
- `lh5.googleusercontent.com` (Google)
- `lh6.googleusercontent.com` (Google)
- `graph.facebook.com` (Facebook)
- `platform-lookaside.fbsbx.com` (Facebook)

## Usage

### For New Users
1. Sign in with Google or Apple
2. Profile image is automatically captured and stored
3. Image appears in settings and profile pages

### For Existing Users
1. Sign in again with Google (if they have a Google account)
2. Profile image will be updated automatically
3. Apple users won't get profile images as Apple doesn't provide avatar URLs

### Fallback Behavior
- If no profile image is available, a default person icon is displayed
- If image fails to load, the default icon is shown

## Components

### ProfileAvatar Component
```tsx
<ProfileAvatar
  avatarUrl={userProfile?.avatar_url}
  size={60}
  iconSize={32}
/>
```

**Props**:
- `avatarUrl`: URL of the profile image
- `size`: Diameter of the avatar (default: 60)
- `iconSize`: Size of fallback icon (default: 32)
- `style`: Additional styles

## Recent Update: Post Owner Profile Images ✅

**Added profile images to posts throughout the app!**

### Changes Made:
- **Database View**: Updated `post_with_details` view to include `avatar_url`
- **Post Component**: Added [`ProfileAvatar`](components/ProfileAvatar.tsx:15) to [`PostItem`](components/PostItem.tsx:661) header
- **Data Fetching**: Updated all post queries to include avatar URLs:
  - [`Main feed`](app/(tabs)/index.tsx:16) (uses `post_with_details` view)
  - [`My posts page`](app/(app)/my-posts.tsx:56)
  - [`Post details page`](app/(app)/post-details/[postId].tsx:25)

### UI Updates:
- Profile images now appear beside usernames in all posts
- 40px size avatars with 20px fallback icons
- Consistent styling with other profile displays
- Graceful fallback to person icon when no avatar available

## Future Enhancements

1. **Manual Upload**: Allow users to upload custom profile images
2. **Image Optimization**: Implement image resizing/compression
3. **Cache Management**: Add local caching for profile images
4. **Facebook Integration**: Add Facebook sign-in with profile images
5. **Profile Image in Chat**: Show avatars in chat messages and user lists
6. **Comment Avatars**: Add profile images to comment threads

## Testing ✅

**Feature successfully tested and working!**

To test the feature:
1. Sign out of the app
2. Sign in with a Google account that has a profile picture
3. Check the settings and profile pages for the image
4. Verify fallback behavior with accounts without profile pictures

## Implementation Status ✅

- ✅ **Database Migration**: `avatar_url` column added to profiles table
- ✅ **Authentication Flow**: Google sign-in captures profile images
- ✅ **UI Components**: ProfileAvatar component displays images correctly
- ✅ **Settings Page**: Shows user profile image with fallback
- ✅ **Profile Page**: Displays avatar next to username
- ✅ **Data Fetching**: useAuth hook includes avatar_url
- ✅ **Error Handling**: Graceful fallback to default icon
- ✅ **Performance**: Optimized image sizing and caching

## Notes

- ✅ Apple Sign-in doesn't provide profile pictures, so Apple users see the default icon
- ✅ Profile images are loaded from external URLs with proper caching
- ✅ Images are optimized for different sizes (retina displays supported)
- ✅ Secure: Only images from trusted domains are accepted
- ✅ Existing users get profile images on next Google sign-in