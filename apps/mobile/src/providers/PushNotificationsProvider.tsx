import React, { type ReactNode } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}
