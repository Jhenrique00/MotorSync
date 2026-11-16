import React from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { DemoProvider } from '../src/contexts/DemoContext';
import { ListingFavoritesProvider } from '../src/contexts/ListingFavoritesContext';
import { ActivityIndicator, View } from 'react-native';
import { fontFiles } from '../src/theme/fonts';
export { ErrorBoundary } from 'expo-router';
function Routes() {
  const { colors, mode, ready, reduceMotion } = useTheme();
  // If a font fails to load the app still opens (platform fallback) instead of blocking.
  const [fontsLoaded, fontError] = useFonts(fontFiles);
  if (!ready || !(fontsLoaded || fontError))
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'none',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="create"
          options={{
            presentation: 'transparentModal',
            contentStyle: { backgroundColor: 'transparent' },
            animation: reduceMotion ? 'none' : 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
export default function Root() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ListingFavoritesProvider>
          <DemoProvider>
            <Routes />
          </DemoProvider>
        </ListingFavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
