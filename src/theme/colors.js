/*
  Brand colors + light/dark palettes.

  `colors` stays exported as the LIGHT palette so any screen not yet migrated
  to the theme system keeps working unchanged. Migrated screens pull their
  palette from useTheme() instead — see ThemeContext.js.

  The brand hues (rider/driver/gold/error/teal) are intentionally shared
  across both modes; only the neutral scale and surface colors flip. In dark
  mode the `gray` scale is INVERTED, so a style written as gray[50] for a page
  background becomes near-black automatically, and gray[900] text becomes
  near-white — that's what lets existing StyleSheets theme themselves without
  being rewritten.
*/

const brand = {
  rider: { light: '#4EA701', dark: '#228B22' },
  driver: { light: '#36578C', dark: '#03263A' },
  gold: { light: '#FFD700', dark: '#D1B000' },
  error: { light: '#E10000', dark: '#AE0000' },
  teal: { light: '#06B6D4', dark: '#0E7490' },
};

export const lightColors = {
  ...brand,
  mode: 'light',
  white: '#FFFFFF',
  black: '#000000',
  // Surface aliases — prefer these in new code over raw gray steps.
  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const darkColors = {
  ...brand,
  // Brighter brand variants read better on dark surfaces.
  rider: { light: '#6FD11A', dark: '#4EA701' },
  driver: { light: '#5B82C4', dark: '#0A3550' },
  error: { light: '#FF4D4D', dark: '#E10000' },
  mode: 'dark',
  white: '#FFFFFF',
  black: '#000000',
  // Not pure black: dark gray reduces halation/smearing on OLED at night and
  // is easier on the eyes than maximum contrast.
  background: '#0F1418',
  surface: '#1A2027',
  border: '#2C343D',
  // Inverted neutral scale (see note above).
  gray: {
    50: '#0F1418',
    100: '#161C22',
    200: '#2C343D',
    300: '#3D4752',
    400: '#6B7682',
    500: '#98A2AE',
    600: '#B6BEC8',
    700: '#D2D8DF',
    800: '#E8ECF0',
    900: '#F5F7FA',
  },
};

// Default export remains the light palette for unmigrated screens.
export const colors = lightColors;
