import React from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card, LoadingScreen } from '../../../src/components/ui';
import { OrderCard } from '../../../src/components/order';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('pro.ordersTitle')}</Text>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
  },
  listContent: {
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
