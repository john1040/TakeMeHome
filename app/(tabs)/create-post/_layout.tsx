import React from 'react';
import { Stack } from 'expo-router';

export default function CreatePostLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      animation: 'slide_from_right',
      headerBackVisible: false, // This will hide the back button
    }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }} 
      />
      <Stack.Screen 
        name="image-selection" 
        options={{ 
          title: 'Select Images',
          headerLeft: () => null, // This ensures no back button is shown
        }} 
      />
      <Stack.Screen 
        name="description-location" 
        options={{ 
          title: 'Add Details',
        }} 
      />
      <Stack.Screen 
        name="review-submit" 
        options={{ 
          title: 'Review & Submit',
        }} 
      />
    </Stack>
  );
}