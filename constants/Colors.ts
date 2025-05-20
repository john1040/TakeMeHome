/**
 * Color palette for the app with light and dark mode themes
 * Based on UI designer's specifications
 */

// Base color palette
const palette = {
  white: '#FFFFFF',    // Pure white
  cream: '#EFDB78',    // Light warm yellow
  gold: '#EEC760',     // Golden yellow
  sage: '#94C4A4',     // Sage green
  teal: '#6A9486',     // Muted teal
  deepTeal: '#406A5E', // Deep teal
  forest: '#33473A',   // Dark green
  carbon: '#212121'    // Nearly black
} as const;

export const Colors = {
  light: {
    // Core UI colors
    text: palette.carbon,
    background: palette.white,
    tint: palette.deepTeal,
    icon: palette.teal,
    tabIconDefault: palette.teal,
    tabIconSelected: palette.deepTeal,

    // Additional semantic colors
    primary: palette.deepTeal,
    secondary: palette.sage,
    accent: palette.gold,
    surface: palette.white,
    border: palette.teal,
    disabled: palette.teal + '80', // 50% opacity
    error: '#FF3B30',
    success: palette.sage
  },
  dark: {
    // Core UI colors
    text: palette.white,
    background: palette.carbon,
    tint: palette.sage,
    icon: palette.teal,
    tabIconDefault: palette.teal,
    tabIconSelected: palette.sage,

    // Additional semantic colors
    primary: palette.sage,
    secondary: palette.deepTeal,
    accent: palette.gold,
    surface: palette.forest,
    border: palette.teal,
    disabled: palette.teal + '80', // 50% opacity
    error: '#FF453A',
    success: palette.sage
  }
} as const;

// Export palette for direct color access if needed
export { palette };
