import React, { useState } from 'react';
import { View, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ProfileAvatarProps {
  avatarUrl?: string;
  size?: number;
  iconSize?: number;
  style?: any;
}

export default function ProfileAvatar({ 
  avatarUrl, 
  size = 60, 
  iconSize = 32,
  style
}: ProfileAvatarProps) {
  const colorScheme = useColorScheme();
  const [imageError, setImageError] = useState(false);
  
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: avatarUrl && !imageError ? 'transparent' : Colors[colorScheme ?? 'light'].primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
  };

  const imageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  // Process avatar URL to ensure it's properly formatted for Google images
  const processedAvatarUrl = avatarUrl ? avatarUrl.replace(/=s\d+$/, `=s${size * 2}`) : undefined;

  return (
    <View style={[containerStyle, style]}>
      {processedAvatarUrl && !imageError ? (
        <Image
          source={{ 
            uri: processedAvatarUrl,
            cache: 'force-cache'
          }}
          style={imageStyle}
          onLoad={() => setImageError(false)}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <Ionicons
          name="person"
          size={iconSize}
          color={Colors[colorScheme ?? 'light'].surface}
        />
      )}
    </View>
  );
}