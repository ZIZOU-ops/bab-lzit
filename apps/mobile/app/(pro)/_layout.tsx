import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { ErrorBoundary, LoadingScreen } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';

export default function ProLayout() {
  const { state, user } = useAuth();

  if (state === 'loading') {
    return <LoadingScreen />;
  }

  if (state === 'unauthenticated') {
    return <Redirect href="/(auth)" />;
  }

  if (user?.role !== 'pro') {
    return <Redirect href="/(client)/(tabs)" />;
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="order/offers" />
        <Stack.Screen name="order/chat" />
      </Stack>
    </ErrorBoundary>
  );
}
