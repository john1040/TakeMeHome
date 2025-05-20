import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors, palette } from '@/constants/Colors';

export type ThemedButtonProps = {
  onPress: () => void;
  title?: string;
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'primary' | 'secondary' | 'accent' | 'error';
  size?: 'small' | 'medium' | 'large';
  variant?: 'solid' | 'outlined';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
  disabled?: boolean;
};

export function ThemedButton({
  onPress,
  title,
  lightColor,
  darkColor,
  type = 'default',
  size = 'medium',
  variant = 'solid',
  style,
  textStyle,
  children,
  disabled = false,
}: ThemedButtonProps) {
  // Map button types to theme colors
  const getThemeColor = (buttonType: ThemedButtonProps['type']) => {
    switch (buttonType) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      case 'accent':
        return 'accent';
      case 'error':
        return 'error';
      default:
        return 'background';
    }
  };

  const backgroundColor = useThemeColor({}, getThemeColor(type));
  const borderColor = useThemeColor({}, type === 'default' ? 'border' : getThemeColor(type));
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'solid' && { backgroundColor },
        variant === 'outlined' && {
          backgroundColor: 'transparent',
          borderColor: borderColor,
        },
        size === 'small' && styles.buttonSmall,
        size === 'medium' && styles.buttonMedium,
        size === 'large' && styles.buttonLarge,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {children ? (
        children
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'solid' && { 
              color: type === 'default' ? 
                Colors.light.text : 
                palette.white 
            },
            variant === 'outlined' && { 
              color: type === 'default' ? 
                Colors.light.text : 
                borderColor 
            },
            size === 'small' && styles.textSmall,
            size === 'medium' && styles.textMedium,
            size === 'large' && styles.textLarge,
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMedium: {
    fontSize: 16,
    lineHeight: 24,
  },
  textLarge: {
    fontSize: 18,
    lineHeight: 28,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.7,
  },
});

export default ThemedButton;