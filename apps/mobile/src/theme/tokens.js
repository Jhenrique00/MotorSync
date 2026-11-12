// Semantic design tokens: screens use roles, not literal brand colors.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, section: 28 };
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const type = { caption: 13, body: 16, subtitle: 20, title: 30, metric: 32 };
export const typography = { fontFamily: undefined, letterSpacing: -0.2, titleTracking: -0.9 };
export const elevation = { card: 0, sheet: 8 };
const shared = {
  white: '#FFFFFF',
  hero: '#111418',
  onMedia: '#FFFFFF',
  mediaMuted: '#E7E9EC',
  scrim: '#00000099',
  mediaControl: '#111418E6',
  mediaGradient: ['#00000024', '#00000000', '#000000D9', '#000000F5'],
};
export const palettes = {
  light: {
    ...shared,
    background: '#F6F7F8',
    surface: '#FFFFFF',
    elevated: '#F1F3F5',
    text: '#111418',
    muted: '#5F6773',
    border: '#E3E7EB',
    fieldBorder: '#7B8490',
    accent: '#FF6B00',
    onAccent: '#111418',
    accentText: '#A84100',
    accentSoft: '#FFF0E5',
    mediaAccent: '#FFB176',
    success: '#176B46',
    danger: '#B42332',
    warning: '#805600',
    info: '#2458A5',
    chrome: ['#475260', '#707B89', '#505C6C', '#677382', '#46515F'],
  },
  dark: {
    ...shared,
    background: '#07090C',
    surface: '#11151B',
    elevated: '#171C23',
    text: '#F3F5F7',
    muted: '#B6BDC7',
    border: '#262D36',
    fieldBorder: '#778392',
    accent: '#3B82F6',
    onAccent: '#07090C',
    accentText: '#78B3FF',
    accentSoft: '#142743',
    mediaAccent: '#8DC0FF',
    success: '#7AD9AD',
    danger: '#FF9AA4',
    warning: '#F1CB79',
    info: '#8DC0FF',
    chrome: ['#F8FAFC', '#C9CED6', '#9AA3AF', '#E7E9EC', '#B1B8C2'],
  },
};
