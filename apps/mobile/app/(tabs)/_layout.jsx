import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { BottomBar } from '../../src/components/BottomBar';
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'none' }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="management" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
