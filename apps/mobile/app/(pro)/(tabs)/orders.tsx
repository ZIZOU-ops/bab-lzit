import React from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card, LoadingScreen, ScreenHeader } from '../../../src/components/ui';
import { OrderCard } from '../../../src/components/order';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useProOrders } from '../../../src/hooks/pro/useProQueries';
import { useProSocket } from '../../../src/hooks/pro/useProSocket';

export default function ProOrdersScreen() {
  const { t } = useTranslation();
  const ordersQuery = useProOrders();

  useProSocket();

  if (ordersQuery.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('pro.ordersTitle')} showBack={false} />

      <FlatList
        data={ordersQuery.orders}
        keyExtractor={(item) => item.assignmentId}
        renderItem={({ item }) => (
          <OrderCard
            order={{
              id: item.id,
              serviceType: item.serviceType,
              status: item.status,
              floorPrice: item.floorPrice,
              finalPrice: item.finalPrice,
              createdAt: item.createdAt,
              location: item.location,
            }}
            onPress={() => router.push(`/(pro)/order/${item.id}`)}
          />
        )}
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
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="briefcase-outline" size={spacing['2xl']} color={colors.clay} />
            </View>
            <Text style={styles.empty}>{t('pro.noAssignmentsYet')}</Text>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
  emptyCard: {
    marginTop: spacing['2xl'],
    borderRadius: radius.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  emptyIconWrap: {
    width: spacing['2xl'] * 2,
    height: spacing['2xl'] * 2,
    borderRadius: radius.full,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
