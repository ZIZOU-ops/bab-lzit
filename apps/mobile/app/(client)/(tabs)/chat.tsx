import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, LoadingScreen, ScreenHeader } from '../../../src/components/ui';
import { OrderCard } from '../../../src/components/order';
import {
  isClientOrderItem,
  isMenageOrder,
} from '../../../src/components/order/orderListItem';
import { colors, radius, spacing, textStyles } from '../../../src/constants/theme';
import { useOrders } from '../../../src/hooks/orders/useOrderQueries';
import { getPageItems } from '../../../src/lib/pagination';

const activeStatuses = new Set(['negotiating', 'accepted', 'en_route', 'in_progress']);
type ChatFilter = 'active' | 'all';
const FILTER_TRACK_INSET = 4;
const FILTER_PILL_WIDTH = 96;

export default function ChatTabScreen() {
  const { t } = useTranslation();
  const ordersQuery = useOrders();
  const [filter, setFilter] = useState<ChatFilter>('active');
  const sliderX = useRef(new Animated.Value(FILTER_TRACK_INSET)).current;
  const items = useMemo(
    () =>
      ordersQuery.data?.pages?.flatMap((page) =>
        getPageItems(page).filter(isClientOrderItem).filter(isMenageOrder),
      ) ?? [],
    [ordersQuery.data?.pages],
  );

  const filteredItems = useMemo(
    () =>
      filter === 'active' ? items.filter((item) => activeStatuses.has(item.status)) : items,
    [filter, items],
  );
  const hasActiveChats = useMemo(
    () => items.some((item) => activeStatuses.has(item.status)),
    [items],
  );

  useEffect(() => {
    Animated.spring(sliderX, {
      toValue: filter === 'active' ? FILTER_TRACK_INSET : FILTER_TRACK_INSET + FILTER_PILL_WIDTH,
      damping: 18,
      mass: 0.7,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
  }, [filter, sliderX]);

  if (ordersQuery.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('nav.chat')} showBack={false} />
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            ctaLabel={t('orders.openChat')}
            onPress={() =>
              router.push({
                pathname: '/(client)/order/chat',
                params: { orderId: item.id },
              })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.filtersWrap}>
            <View style={styles.filtersTrack}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.filterSlider,
                  {
                    transform: [{ translateX: sliderX }],
                  },
                ]}
              />
              <Pressable
                onPress={() => setFilter('active')}
                style={({ pressed }) => [
                  styles.filterPill,
                  pressed && styles.filterPillPressed,
                ]}
              >
                <View style={styles.filterContent}>
                  <Text
                    style={[
                      styles.filterLabel,
                      filter === 'active' && styles.filterLabelActive,
                    ]}
                  >
                    {t('orders.tabActive')}
                  </Text>
                  {hasActiveChats ? <View style={styles.filterDot} /> : null}
                </View>
              </Pressable>

              <Pressable
                onPress={() => setFilter('all')}
                style={({ pressed }) => [
                  styles.filterPill,
                  pressed && styles.filterPillPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    filter === 'all' && styles.filterLabelActive,
                  ]}
                >
                  {t('chat.filterAll')}
                </Text>
              </Pressable>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={ordersQuery.isRefetching}
            onRefresh={ordersQuery.refetch}
            tintColor={colors.navy}
          />
        }
        onEndReached={() => {
          if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
            void ordersQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          ordersQuery.isFetchingNextPage ? <ActivityIndicator color={colors.navy} /> : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="chat-processing-outline" size={spacing['2xl']} color={colors.navy} />
            </View>
            <Text style={styles.emptyTitle}>{t('chat.title')}</Text>
            <Text style={styles.emptyText}>
              {filter === 'active' ? t('orders.emptyActive') : t('orders.empty')}
            </Text>
            <Button
              variant="primary"
              label={t('booking.selectService')}
              onPress={() => router.push('/(client)/booking/service')}
              style={styles.emptyBtn}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  filtersWrap: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  filtersTrack: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#D9DBE8',
    overflow: 'hidden',
  },
  filterSlider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    width: FILTER_PILL_WIDTH,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
  },
  filterPill: {
    width: FILTER_PILL_WIDTH,
    minHeight: 36,
    backgroundColor: colors.transparent,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    zIndex: 1,
  },
  filterPillPressed: {
    opacity: 0.88,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.error,
  },
  filterLabel: {
    ...textStyles.body,
    fontFamily: 'DMSans_600SemiBold',
    color: colors.textSec,
  },
  filterLabelActive: {
    color: colors.surface,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: spacing['2xl'] * 2,
    height: spacing['2xl'] * 2,
    borderRadius: spacing['2xl'],
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...textStyles.h2,
    color: colors.navy,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyBtn: {
    width: spacing['2xl'] * 5,
    marginTop: spacing.sm,
  },
});
