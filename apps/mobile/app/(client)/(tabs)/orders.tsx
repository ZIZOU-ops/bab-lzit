import React from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, LoadingScreen, ScreenHeader } from '../../../src/components/ui';
import { colors, fonts, radius, spacing, textStyles } from '../../../src/constants/theme';
import { OrderCard } from '../../../src/components/order';
import {
  isClientOrderItem,
  isMenageOrder,
} from '../../../src/components/order/orderListItem';
import { useOrders } from '../../../src/hooks/orders/useOrderQueries';
import { getPageItems } from '../../../src/lib/pagination';

export default function OrdersTabScreen() {
  const { t } = useTranslation();
  const ordersQuery = useOrders();

  if (ordersQuery.isLoading) {
    return <LoadingScreen />;
  }

  const items =
    ordersQuery.data?.pages?.flatMap((page) =>
      getPageItems(page).filter(isClientOrderItem).filter(isMenageOrder),
    ) ?? [];

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('orders.myOrders')} showBack={false} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} onPress={() => router.push(`/(client)/order/${item.id}`)} />}
        contentContainerStyle={styles.listContent}
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
              <MaterialCommunityIcons name="clipboard-text-outline" size={spacing['2xl']} color={colors.clay} />
            </View>
            <Text style={styles.emptyTitle}>{t('orders.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('orders.empty')}</Text>
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
  header: {
    backgroundColor: colors.navy,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + spacing.xs,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTitle: {
    fontFamily: fonts.nunito.bold,
    fontSize: 22,
    color: colors.white,
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
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
    backgroundColor: colors.clayTint,
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
