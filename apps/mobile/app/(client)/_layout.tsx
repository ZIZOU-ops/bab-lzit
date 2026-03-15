import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { ErrorBoundary, LoadingScreen } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/service" />
        <Stack.Screen name="booking/details" />
        <Stack.Screen name="booking/search" />
        <Stack.Screen name="booking/confirm" />
        <Stack.Screen name="booking/confirmed" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="order/chat" />
        <Stack.Screen name="order/tracking" />
        <Stack.Screen name="order/rating" />
      </Stack>
    </ErrorBoundary>
  );
}
