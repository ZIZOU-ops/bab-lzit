import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { ErrorBoundary, LoadingScreen } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/constants/theme';

export default function ClientLayout() {
  const { state, user } = useAuth();

  if (state === 'loading') {
    return <LoadingScreen />;
  }

  if (state === 'unauthenticated') {
    return <Redirect href="/(auth)" />;
  }

  if (user?.role === 'pro') {
    return <Redirect href="/(pro)/(tabs)" />;
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/service" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="booking/clean-type" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="booking/schedule" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="booking/details" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking/search" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking/confirm" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking/confirmed" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="order/chat" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="order/tracking" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="order/rating" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </ErrorBoundary>
  );
}
