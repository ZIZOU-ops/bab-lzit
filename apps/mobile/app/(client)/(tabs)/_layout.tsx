import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  isClientOrderItem,
  isMenageOrder,
} from '../../../src/components/order/orderListItem';
import { colors, spacing } from '../../../src/constants/theme';
import { useOrders } from '../../../src/hooks/orders/useOrderQueries';
import { getPageItems } from '../../../src/lib/pagination';

const activeStatuses = new Set(['negotiating', 'accepted', 'en_route', 'in_progress']);

export default function ClientTabsLayout() {
  const { t } = useTranslation();
  const ordersQuery = useOrders();
  const items =
    ordersQuery.data?.pages?.flatMap((page) =>
      getPageItems(page).filter(isClientOrderItem).filter(isMenageOrder),
    ) ?? [];
  const hasActiveChats = items.some((item) => activeStatuses.has(item.status));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconFrame, focused && styles.iconFrameActive]}>
              <Ionicons
                name="home"
                size={size + 3}
                color={focused ? colors.navy : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('nav.calendar'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconFrame, focused && styles.iconFrameActive]}>
              <Ionicons
                name="calendar"
                size={size + 3}
                color={focused ? colors.navy : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('nav.chat'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconFrame, focused && styles.iconFrameActive]}>
              <Ionicons
                name="chatbubbles"
                size={size + 2}
                color={focused ? colors.navy : color}
              />
              {hasActiveChats ? <View style={styles.chatDot} /> : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconFrame, focused && styles.iconFrameActive]}>
              <Ionicons
                name="person-circle"
                size={size + 4}
                color={focused ? colors.navy : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: colors.border,
    borderTopWidth: 4,
    backgroundColor: colors.surface,
    height: 84,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingTop: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 14,
  },
  tabItem: {
    paddingTop: 0,
  },
  tabLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: spacing.sm + 3,
  },
  iconFrame: {
    minWidth: 40,
    minHeight: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFrameActive: {
    backgroundColor: colors.navyTint06,
  },
  chatDot: {
    position: 'absolute',
    top: 4,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
