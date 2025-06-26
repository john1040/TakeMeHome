import { View, type ViewProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'surface' | 'primary' | 'secondary';
  withBorder?: boolean;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'default',
  withBorder = false,
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { 
      light: lightColor, 
      dark: darkColor 
    }, 
    variant === 'default' ? 'background' : 
    variant === 'surface' ? 'surface' :
    variant === 'primary' ? 'primary' : 'secondary'
  );

  const borderColor = useThemeColor({}, 'border');

  return (
    <View 
      style={[
        { backgroundColor },
        withBorder && styles.border,
        withBorder && { borderColor },
        variant === 'surface' && styles.surface,
        style
      ]} 
      {...otherProps} 
    />
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 1,
    borderRadius: 8,
  },
  surface: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
