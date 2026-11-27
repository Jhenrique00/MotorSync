// Semantic design tokens: screens use roles, not literal brand colors.
// Visual language: iOS-inspired (grouped surfaces, hairline borders, soft depth, SF-like type scale).
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, section: 28 };
export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };
export const type = { caption: 13, body: 16, subtitle: 19, title: 28, metric: 32 };
// Families live in theme/fonts.js (Playfair Display + Inter).
export const typography = { letterSpacing: -0.15, titleTracking: -0.5 };
export const hairline = 0.75;
export const elevation = { card: 1, sheet: 8 };
const shared = {
  white: '#FFFFFF',
  hero: '#111111',
  onMedia: '#FFFFFF',
  mediaMuted: '#E6E6E6',
  scrim: '#00000085',
  mediaControl: '#0A0A0AD9',
  heroSoft: '#FFFFFF14',
  heroBorder: '#FFFFFF1F',
  mediaGradient: ['#00000024', '#00000000', '#000000D9', '#000000F5'],
};
export const palettes = {
  light: {
    ...shared,
    background: '#F5F5F5',
    surface: '#FFFFFF',
    elevated: '#EEEEEE',
    text: '#0F0F0F',
    muted: '#5E5E5E',
    border: '#E2E2E2',
    fieldBorder: '#858585',
    accent: '#FF6B00',
    onAccent: '#0F0F0F',
    accentText: '#A84100',
    accentSoft: '#FFF0E5',
    mediaAccent: '#FFB176',
    success: '#176B46',
    danger: '#B42332',
    warning: '#805600',
    info: '#A84100',
    chrome: ['#475260', '#707B89', '#505C6C', '#677382', '#46515F'],
    lift: {
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
  },
  dark: {
    ...shared,
    background: '#000000',
    surface: '#0D0D0D',
    elevated: '#171717',
    text: '#F5F5F5',
    muted: '#B3B3B3',
    border: '#2A2A2A',
    fieldBorder: '#808080',
    accent: '#FF6B00',
    onAccent: '#000000',
    accentText: '#FFB176',
    accentSoft: '#2B1B0E',
    mediaAccent: '#FFB176',
    success: '#7AD9AD',
    danger: '#FF9AA4',
    warning: '#F1CB79',
    info: '#FFB176',
    chrome: ['#F8FAFC', '#C9CED6', '#9AA3AF', '#E7E9EC', '#B1B8C2'],
    lift: {
      shadowColor: '#000000',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
  },
};
