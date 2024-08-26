import React from 'react';
import { Stack, usePathname } from 'expo-router';

export default function CreatePostLayout() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (!pathname.startsWith('/create-post')) {
      // Reset the stack when navigating away from create-post
      // This assumes you have a method to reset the stack
      // You might need to implement this based on your navigation setup
      // resetCreatePostStack();
    }
  }, [pathname]);

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Create Post',
          headerShown: false,
          animation: 'slide_from_bottom'
        }} 
      />
      <Stack.Screen 
        name="image-selection" 
        options={{ 
          title: 'Select Images',
          animation: 'slide_from_right'
        }} 
      />
      <Stack.Screen 
        name="description-location" 
        options={{ 
          title: 'Add Details',
          animation: 'slide_from_right'
        }} 
      />
      <Stack.Screen 
        name="review-submit" 
        options={{ 
          title: 'Review & Submit',
          animation: 'slide_from_right'
        }} 
      />
    </Stack>
  );
}