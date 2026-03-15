import React from 'react';
import { Redirect } from 'expo-router';
import { LoadingScreen } from '../src/components/ui';
import { useAuth } from '../src/providers/AuthProvider';

export default function IndexScreen() {
  const { state, user } = useAuth();

  if (state === 'loading') {
    return <LoadingScreen />;
  }

  if (state === 'unauthenticated') {
    return <Redirect href="/(auth)" />;
  }

  if (user?.role === 'pro') {
    return <Redirect href="/(pro)" />;
  }

  return <Redirect href="/(client)" />;
}
