import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Alexandria_300Light,
  Alexandria_400Regular,
  Alexandria_500Medium,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
  Alexandria_900Black,
} from '@expo-google-fonts/alexandria';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../src/components/ui';
import { AuthProvider } from '../src/providers/AuthProvider';
import { CircularRevealProvider } from '../src/providers/CircularRevealProvider';
import { I18nProvider } from '../src/providers/I18nProvider';
import { PushNotificationsProvider } from '../src/providers/PushNotificationsProvider';
import { SocketProvider } from '../src/providers/SocketProvider';
import { TRPCProvider } from '../src/providers/TRPCProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    Alexandria_300Light,
    Alexandria_400Regular,
    Alexandria_500Medium,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
    Alexandria_900Black,
    DMSans_300Light: require('../assets/fonts/DMSans-Light.ttf'),
    DMSans_400Regular: require('../assets/fonts/DMSans-Regular.ttf'),
    DMSans_500Medium: require('../assets/fonts/DMSans-Medium.ttf'),
    DMSans_600SemiBold: require('../assets/fonts/DMSans-SemiBold.ttf'),
    DMSans_700Bold: require('../assets/fonts/DMSans-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Don't hide splash here — let the auth page hide it
      // after the Grainient WebView is loaded.
      // Fallback: hide after 3s in case we're not on auth.
      const timeout = setTimeout(() => {
        void SplashScreen.hideAsync();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    const errorUtils = (globalThis as typeof globalThis & {
      ErrorUtils?: {
        getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
        setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
    }).ErrorUtils;

    const previousGlobalHandler = errorUtils?.getGlobalHandler?.();
    if (errorUtils?.setGlobalHandler) {
      errorUtils.setGlobalHandler((error, isFatal) => {
        console.error('[GlobalJSException]', {
          isFatal: Boolean(isFatal),
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        });
        previousGlobalHandler?.(error, isFatal);
      });
    }

    type GlobalWithRejectionHandler = typeof globalThis & {
      onunhandledrejection?: ((event: { reason?: unknown }) => void) | null;
    };

    const globalWithRejectionHandler = globalThis as GlobalWithRejectionHandler;
    const previousUnhandledRejection = globalWithRejectionHandler.onunhandledrejection;
    globalWithRejectionHandler.onunhandledrejection = (event) => {
      const reason = event?.reason;
      if (reason instanceof Error) {
        console.error('[UnhandledPromiseRejection]', {
          message: reason.message,
          stack: reason.stack,
        });
      } else {
        console.error('[UnhandledPromiseRejection]', { reason });
      }

      previousUnhandledRejection?.(event);
    };

    return () => {
      if (errorUtils?.setGlobalHandler && previousGlobalHandler) {
        errorUtils.setGlobalHandler(previousGlobalHandler);
      }
      globalWithRejectionHandler.onunhandledrejection = previousUnhandledRejection ?? null;
    };
  }, []);

  return (
    <I18nProvider>
      <ErrorBoundary>
        <AuthProvider>
          <TRPCProvider>
            <SocketProvider>
              <PushNotificationsProvider>
                <CircularRevealProvider>
                  <View style={rootStyles.container}>
                    <StatusBar style="light" />
                    <Slot />
                  </View>
                </CircularRevealProvider>
              </PushNotificationsProvider>
            </SocketProvider>
          </TRPCProvider>
        </AuthProvider>
      </ErrorBoundary>
    </I18nProvider>
  );
}

const rootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1442',
  },
});
