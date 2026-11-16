// Per-weight imports keep the bundle to the six files actually used.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';

// Official typography (both families: SIL Open Font License 1.1).
// Playfair Display: main titles, headers and editorial highlights only.
// Inter: everything functional (text, buttons, menus, forms, prices, indicators, charts).
export const fontFiles = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
};

export const families = {
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
};

// Custom fonts ship one file per weight, so the family is chosen by weight (fontWeight is omitted).
export function familyFor(weight = '400', display = false) {
  const w = Number(weight) || (weight === 'bold' ? 700 : 400);
  if (display) return w >= 700 ? families.displayBold : families.display;
  if (w >= 700) return families.bold;
  if (w >= 600) return families.semibold;
  if (w >= 500) return families.medium;
  return families.body;
}

// Functional text keeps restraint: 700 becomes SemiBold, except figures and large sizes.
export function refineWeight(weight, size) {
  if (weight === '800' || weight === '900') return '700';
  if (weight === '700' || weight === 'bold') return size >= 24 ? '700' : '600';
  return weight;
}

export function trackingFor(size, display = false) {
  if (display) return size >= 28 ? -0.5 : -0.2;
  if (size >= 28) return -0.6;
  if (size >= 20) return -0.35;
  if (size >= 16) return -0.15;
  return 0;
}

export function leadingFor(size, display = false) {
  if (display) return size >= 24 ? 1.15 : 1.22;
  if (size >= 28) return 1.16;
  if (size >= 20) return 1.25;
  if (size >= 16) return 1.35;
  return 1.4;
}

// Backwards-compatible alias for raw inputs.
export const systemFont = families.body;
