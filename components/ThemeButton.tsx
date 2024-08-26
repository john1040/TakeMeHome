import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedButtonProps = {
  onPress: () => void;
  title?: string;
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'primary' | 'danger' | 'secondary';
  size?: 'small' | 'medium' | 'large';
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
  style,
  textStyle,
  children,
  disabled = false,
}: ThemedButtonProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const textColor = useThemeColor({ light: 'black', dark: 'white' }, 'text');

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        size === 'small' ? styles.buttonSmall : undefined,
        size === 'medium' ? styles.buttonMedium : undefined,
        size === 'large' ? styles.buttonLarge : undefined,
        type === 'default' ? styles.buttonDefault : undefined,
        type === 'primary' ? styles.buttonPrimary : undefined,
        type === 'danger' ? styles.buttonDanger : undefined,
        type === 'secondary' ? styles.buttonSecondary : undefined,
        disabled ? styles.buttonDisabled : undefined,
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
            { color: textColor },
            size === 'small' ? styles.textSmall : undefined,
            size === 'medium' ? styles.textMedium : undefined,
            size === 'large' ? styles.textLarge : undefined,
            type === 'default' ? styles.textDefault : undefined,
            type === 'primary' ? styles.textPrimary : undefined,
            type === 'danger' ? styles.textDanger : undefined,
            type === 'secondary' ? styles.textSecondary : undefined,
            disabled ? styles.textDisabled : undefined,
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
    borderRadius: 4,
    borderWidth: 1,
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonLarge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonDefault: {
    backgroundColor: 'white',
    borderColor: 'black',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  buttonSecondary: {
    backgroundColor: '#E5E5EA',
    borderColor: '#E5E5EA',
  },
  text: {
    fontWeight: '500',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  textDefault: {
    color: 'black',
  },
  textPrimary: {
    color: 'white',
  },
  textDanger: {
    color: 'white',
  },
  textSecondary: {
    color: 'black',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.5,
  },
});

export default ThemedButton;