import React, { useMemo } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BackHeader, Button, Card, LoadingScreen } from '../../../src/components/ui';
import { StatusBadge } from '../../../src/components/order';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useCancelOrder, useRateOrder } from '../../../src/hooks/orders/useOrderMutations';
import { useOrder, useOrders } from '../../../src/hooks/orders/useOrderQueries';
import { useOrderSocket } from '../../../src/hooks/orders/useOrderSocket';
import { getErrorMessage } from '../../../src/lib/errors';

const activeStatuses = new Set(['negotiating', 'accepted', 'en_route', 'in_progress']);

const detailIconMap: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  surface: 'ruler-square-compass',
  cleanType: 'water-outline',
  teamType: 'account-group-outline',
  guests: 'silverware-fork-knife',
  children: 'baby-face-outline',
  hours: 'clock-outline',
};

export default function ClientOrderDetailScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = params.id ?? '';
  const orderQuery = useOrder(orderId);
  const cancelOrder = useCancelOrder();
  const rateOrder = useRateOrder();
  const ordersQuery = useOrders();

  useOrderSocket(orderId);

  const timeline = useMemo(() => {
    return [...(orderQuery.data?.statusEvents ?? [])].sort((a, b) => a.seq - b.seq);
  }, [orderQuery.data?.statusEvents]);

  if (orderQuery.isLoading || !orderQuery.data) {
    return <LoadingScreen />;
  }

  const order = orderQuery.data;
  const notesValue =
    order.detail &&
    typeof order.detail === 'object' &&
    'notes' in (order.detail as Record<string, unknown>) &&
    typeof (order.detail as Record<string, unknown>).notes === 'string'
      ? String((order.detail as Record<string, unknown>).notes)
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('orders.orderTitle')} rightElement={<StatusBadge status={order.status} />} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.priceCard}>
          <Text style={styles.sectionLabel}>{t('orders.amount')}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{order.finalPrice ?? order.floorPrice}</Text>
            <Text style={styles.currency}>MAD</Text>
          </View>
          {order.finalPrice ? <Text style={styles.meta}>{t('orders.floor')}: {order.floorPrice} MAD</Text> : null}
        </Card>

        {order.detail ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('orders.detailsSection')}</Text>
            {Object.entries(order.detail).map(([key, value]) => (
              <View style={styles.row} key={key}>
                <View style={styles.rowLabelWrap}>
                  <MaterialCommunityIcons
                    name={detailIconMap[key] ?? 'shape-outline'}
                    size={spacing.md + spacing.xs}
                    color={colors.clay}
                  />
                  <Text style={styles.rowLabel}>{t(`booking.${key}`, { defaultValue: key })}</Text>
                </View>
                <Text style={styles.rowValue}>{String(value ?? t('common.notAvailable'))}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card style={styles.block}>
          <Text style={styles.sectionLabel}>{t('orders.addressSection')}</Text>
          <View style={styles.rowLabelWrap}>
            <MaterialCommunityIcons name="map-marker-outline" size={spacing.md + spacing.xs} color={colors.clay} />
            <Text style={styles.meta}>{order.location}</Text>
          </View>
        </Card>

        <Card style={styles.block}>
          <Text style={styles.sectionLabel}>{t('orders.datesSection')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('orders.createdAt')}</Text>
            <Text style={styles.rowValue}>
              {new Date(order.createdAt).toLocaleDateString(i18n.language)}
            </Text>
          </View>
          {order.updatedAt ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('orders.updatedAt')}</Text>
              <Text style={styles.rowValue}>
                {new Date(order.updatedAt).toLocaleDateString(i18n.language)}
              </Text>
            </View>
          ) : null}
        </Card>

        {notesValue ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('orders.notesSection')}</Text>
            <Text style={styles.meta}>{notesValue}</Text>
          </Card>
        ) : null}

        {timeline.length > 0 ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('tracking.timeline')}</Text>
            {timeline.map((event, index) => (
              <View key={event.id} style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.dot, index === timeline.length - 1 && styles.dotActive]} />
                  {index < timeline.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.timelineText}>
                  <Text style={styles.timelineTitle}>{t(`orders.status.${event.toStatus}`)}</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(event.createdAt).toLocaleString(i18n.language)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={styles.actions}>
          {['draft', 'submitted', 'searching', 'negotiating', 'accepted', 'en_route'].includes(order.status) ? (
            <Button
              variant="outline"
              label={t('booking.cancelOrder')}
              loading={cancelOrder.isPending}
              onPress={() => {
                cancelOrder.mutate(
                  { orderId },
                  {
                    onError(error) {
                      Alert.alert(t('orders.cancelFailedTitle'), getErrorMessage(error, t('orders.cancelFailedMessage')));
                    },
                    async onSuccess() {
                      await orderQuery.refetch();
                      await ordersQuery.refetch();
                    },
                  },
                );
              }}
              style={styles.cancelBtn}
              icon={<Ionicons name="close-circle-outline" size={spacing.md + spacing.xs} color={colors.error} />}
            />
          ) : null}

          {activeStatuses.has(order.status) ? (
            <Button
              variant="primary"
              label={t('orders.openChat')}
              onPress={() =>
                router.push({
                  pathname: '/(client)/order/chat',
                  params: { orderId },
                })
              }
              icon={<Ionicons name="chatbubbles-outline" size={spacing.md + spacing.xs} color={colors.white} />}
            />
          ) : null}

          {activeStatuses.has(order.status) ? (
            <Button
              variant="clay"
              label={t('orders.trackStatus')}
              onPress={() =>
                router.push({
                  pathname: '/(client)/order/tracking',
                  params: { orderId },
                })
              }
              icon={<Ionicons name="navigate-outline" size={spacing.md + spacing.xs} color={colors.white} />}
            />
          ) : null}
        </View>

        {order.status === 'completed' && !order.rating ? (
          <Button
            variant="outline"
            label={t('orders.rateThisOrder')}
            onPress={() =>
              router.push({
                pathname: '/(client)/order/rating',
                params: { orderId },
              })
            }
            icon={<Ionicons name="star-outline" size={spacing.md + spacing.xs} color={colors.navy} />}
          />
        ) : null}

        {order.status === 'completed' ? (
          <Pressable
            style={({ pressed }) => [styles.quickRate, pressed && styles.pressed]}
            onPress={() => {
              rateOrder.mutate(
                { orderId, stars: 5 },
                {
                  onError(error) {
                    Alert.alert(t('rating.submitFailedTitle'), getErrorMessage(error, t('rating.submitFailedMessage')));
                  },
                  async onSuccess() {
                    await orderQuery.refetch();
                    await ordersQuery.refetch();
                  },
                },
              );
            }}
          >
            <Ionicons name="star" size={spacing.md + spacing.xs} color={colors.clay} />
            <Text style={styles.quickRateText}>{t('rating.quickFive')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
  priceCard: { gap: spacing.xs, borderRadius: radius.xl, ...shadows.md },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    fontSize: 9,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 38,
    lineHeight: 44,
  },
  currency: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  block: { gap: spacing.sm, borderRadius: radius.lg },
  meta: { ...textStyles.body, color: colors.textSec },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, alignItems: 'center' },
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  rowLabel: { ...textStyles.body, color: colors.textMuted, flexShrink: 1 },
  rowValue: { ...textStyles.body, color: colors.navy, textAlign: 'right', flexShrink: 1 },
  timelineRow: { flexDirection: 'row', gap: spacing.sm },
  timelineColumn: { width: spacing.md, alignItems: 'center' },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    backgroundColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.clay,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.border,
  },
  timelineText: { flex: 1, paddingBottom: spacing.sm },
  timelineTitle: { ...textStyles.body, color: colors.navy },
  timelineDate: { color: colors.textMuted, fontFamily: 'DMSans_500Medium', fontSize: 11 },
  actions: {
    gap: spacing.sm,
  },
  cancelBtn: {
    borderColor: colors.error,
    backgroundColor: colors.dangerBg,
  },
  quickRate: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.clay,
    backgroundColor: colors.clayTint,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  quickRateText: {
    ...textStyles.body,
    color: colors.clay,
    fontFamily: 'DMSans_700Bold',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
