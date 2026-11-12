import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { DemoProvider } from '../src/contexts/DemoContext';
import { ActivityIndicator, View } from 'react-native';
export { ErrorBoundary } from 'expo-router';
function Routes() {
  const { colors, mode, ready, reduceMotion } = useTheme();
  if (!ready)
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
        <DemoProvider>
          <Routes />
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
