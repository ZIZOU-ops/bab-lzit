import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { trpc } from '../lib/trpc';
import { useAuth } from '../providers/AuthProvider';
import { colors } from '../constants/theme';

type NotificationData = {
  type?: 'message' | 'offer' | 'status' | 'rate' | 'reminder';
  orderId?: string;
};

const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';
type NotificationsModule = typeof import('expo-notifications');

let notificationHandlerConfigured = false;
let notificationsModule: NotificationsModule | null = null;

function getNotificationsModule(): NotificationsModule | null {
  if (isExpoGo) {
    return null;
  }

  if (notificationsModule) {
    return notificationsModule;
  }

  try {
    notificationsModule = require('expo-notifications') as NotificationsModule;
    return notificationsModule;
  } catch {
    return null;
  }
}

function configureNotificationHandler(Notifications: NotificationsModule) {
  if (notificationHandlerConfigured) {
    return;
  }

  if (typeof Notifications.setNotificationHandler !== 'function') {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  notificationHandlerConfigured = true;
}

function routeFromNotification(data: NotificationData, role: 'client' | 'pro' | 'admin' | undefined) {
  if (!data.orderId || !data.type) {
    return null;
  }

  if (data.type === 'message' || data.type === 'offer') {
    if (role === 'pro') {
      return {
        pathname: '/(pro)/order/chat',
        params: { orderId: data.orderId },
      } as const;
    }

    return {
      pathname: '/(client)/order/chat',
      params: { orderId: data.orderId },
    } as const;
  }

  if (data.type === 'status' || data.type === 'reminder') {
    if (role === 'pro') {
      return {
        pathname: '/(pro)/order/[id]',
        params: { id: data.orderId },
      } as const;
    }

    return {
      pathname: '/(client)/order/[id]',
      params: { id: data.orderId },
    } as const;
  }

  if (data.type === 'rate') {
    return {
      pathname: '/(client)/order/rating',
      params: { orderId: data.orderId },
    } as const;
  }

  return null;
}

async function getExpoPushToken(Notifications: NotificationsModule) {
  if (!Constants.isDevice) {
    return null;
  }

  if (
    Platform.OS === 'android' &&
    typeof Notifications.setNotificationChannelAsync === 'function'
  ) {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.navyMid,
    });
  }

  if (
    typeof Notifications.getPermissionsAsync !== 'function' ||
    typeof Notifications.requestPermissionsAsync !== 'function' ||
    typeof Notifications.getExpoPushTokenAsync !== 'function'
  ) {
    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return token.data;
}

export function usePushNotifications() {
  const { state, user } = useAuth();
  const registerPushToken = trpc.user.registerPushToken.useMutation();
  const unregisterPushToken = trpc.user.unregisterPushToken.useMutation();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return;
    }

    configureNotificationHandler(Notifications);
  }, []);

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (state !== 'authenticated' || !Notifications) {
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        const token = await getExpoPushToken(Notifications);
        if (!token || !mounted) {
          return;
        }

        tokenRef.current = token;
        registerPushToken.mutate({ token });
      } catch {
        // Ignore registration failures during startup.
      }
    })();

    return () => {
      mounted = false;
    };
  }, [registerPushToken, state]);

  useEffect(() => {
    if (state === 'authenticated' || !getNotificationsModule()) {
      return;
    }

    const token = tokenRef.current;
    if (!token) {
      return;
    }

    try {
      unregisterPushToken.mutate({ token });
    } catch {
      // Ignore unregistration failures during shutdown.
    }
    tokenRef.current = null;
  }, [state, unregisterPushToken]);

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (
      !Notifications ||
      typeof Notifications.addNotificationReceivedListener !== 'function' ||
      typeof Notifications.addNotificationResponseReceivedListener !== 'function'
    ) {
      return;
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {});

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const payload = response.notification.request.content.data as NotificationData;
      const target = routeFromNotification(payload, user?.role);
      if (!target) {
        return;
      }
      router.push(target as never);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [user?.role]);
}
