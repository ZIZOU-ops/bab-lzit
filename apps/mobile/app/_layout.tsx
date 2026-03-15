import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../src/components/ui';
import { AuthProvider } from '../src/providers/AuthProvider';
import { I18nProvider } from '../src/providers/I18nProvider';
import { PushNotificationsProvider } from '../src/providers/PushNotificationsProvider';
import { SocketProvider } from '../src/providers/SocketProvider';
import { TRPCProvider } from '../src/providers/TRPCProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_300Light: require('../assets/fonts/Fraunces-Light.ttf'),
    Fraunces_500Medium: require('../assets/fonts/Fraunces-Medium.ttf'),
    Fraunces_600SemiBold: require('../assets/fonts/Fraunces-SemiBold.ttf'),
    Fraunces_700Bold: require('../assets/fonts/Fraunces-Bold.ttf'),
    Fraunces_400Regular_Italic: require('../assets/fonts/Fraunces-Italic.ttf'),
    DMSans_300Light: require('../assets/fonts/DMSans-Light.ttf'),
    DMSans_400Regular: require('../assets/fonts/DMSans-Regular.ttf'),
    DMSans_500Medium: require('../assets/fonts/DMSans-Medium.ttf'),
    DMSans_600SemiBold: require('../assets/fonts/DMSans-SemiBold.ttf'),
    DMSans_700Bold: require('../assets/fonts/DMSans-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
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
                <StatusBar style="dark" />
                <Slot />
              </PushNotificationsProvider>
            </SocketProvider>
          </TRPCProvider>
        </AuthProvider>
      </ErrorBoundary>
    </I18nProvider>
  );
}
