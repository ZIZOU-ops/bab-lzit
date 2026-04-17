import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { ErrorBoundary, LoadingScreen } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/constants/theme';

export default function AuthLayout() {
  const { state, user } = useAuth();

  if (state === 'loading') {
    return <LoadingScreen />;
  }

  if (state === 'authenticated') {
    if (user?.role === 'pro') {
      return <Redirect href="/(pro)/(tabs)" />;
    }
    return <Redirect href="/(client)/(tabs)" />;
  }

  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.navy },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in-email" />
        <Stack.Screen name="sign-in-phone" />
        <Stack.Screen name="sign-up-email" />
        <Stack.Screen name="sign-up-phone" />
        <Stack.Screen
          name="otp"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
      </Stack>
    </ErrorBoundary>
  );
}
