import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Pencil, Telescope, User } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Telescope color={color}/>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User color={color}/>
          ),
        }}
      />
      <Tabs.Screen
        name="create-post"
        options={{
          title: 'Create Post',
          tabBarIcon: ({ color, focused }) => (
            <Pencil color={color}/>
          ),
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: 'test',
          tabBarIcon: ({ color, focused }) => (
            <Pencil color={color}/>
          ),
        }}
      />
    </Tabs>
  );
}
