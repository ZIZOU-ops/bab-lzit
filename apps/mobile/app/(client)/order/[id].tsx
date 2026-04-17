import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, LoadingScreen, ScreenHeader } from '../../../src/components/ui';
import { StatusBadge } from '../../../src/components/order';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useCancelOrder, useRateOrder } from '../../../src/hooks/orders/useOrderMutations';
import { useOrder, useOrders } from '../../../src/hooks/orders/useOrderQueries';
import { useOrderSocket } from '../../../src/hooks/orders/useOrderSocket';
import { formatShortDate } from '../../../src/lib/date';
import { getErrorMessage } from '../../../src/lib/errors';

const activeStatuses = new Set(['negotiating', 'accepted', 'en_route', 'in_progress']);

type ServiceType = 'menage' | 'cuisine' | 'childcare';

type DetailField = {
  key: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const DETAIL_FIELDS_BY_SERVICE: Record<ServiceType, DetailField[]> = {
  menage: [
    { key: 'surface', icon: 'ruler-square-compass' },
    { key: 'cleanType', icon: 'water-outline' },
    { key: 'teamType', icon: 'account-group-outline' },
    { key: 'squadSize', icon: 'account-multiple-plus-outline' },
  ],
  cuisine: [
    { key: 'guests', icon: 'silverware-fork-knife' },
    { key: 'dishes', icon: 'food-outline' },
  ],
  childcare: [
    { key: 'children', icon: 'baby-face-outline' },
    { key: 'hours', icon: 'clock-outline' },
  ],
};

function hasRenderableDetailValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

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
  const detail =
    order.detail && typeof order.detail === 'object'
      ? (order.detail as Record<string, unknown>)
      : null;
  const notesValue =
    detail &&
    typeof detail.notes === 'string' &&
    detail.notes.trim().length > 0
      ? detail.notes.trim()
      : null;
  const detailRows = detail
    ? DETAIL_FIELDS_BY_SERVICE[order.serviceType as ServiceType]
        .map((field) => {
          const rawValue = detail[field.key];

          if (!hasRenderableDetailValue(rawValue)) {
            return null;
          }

          return {
            key: field.key,
            icon: field.icon,
            label: t(`booking.${field.key}`, {
              defaultValue: field.key === 'squadSize' ? 'Taille de l\'équipe' : field.key,
            }),
            value:
              field.key === 'cleanType' || field.key === 'teamType'
                ? t(`booking.${String(rawValue)}`, { defaultValue: String(rawValue) })
                : String(rawValue),
          };
        })
        .filter(
          (
            row,
          ): row is {
            key: string;
            icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
            label: string;
            value: string;
          } => Boolean(row),
        )
    : [];

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('orders.orderTitle')} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <Text style={styles.sectionLabel}>{t('orders.amount')}</Text>
            <StatusBadge status={order.status} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{order.finalPrice ?? order.floorPrice}</Text>
            <Text style={styles.currency}>MAD</Text>
          </View>
          {order.finalPrice ? <Text style={styles.meta}>{t('orders.floor')}: {order.floorPrice} MAD</Text> : null}
        </Card>

        {detailRows.length > 0 ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('orders.detailsSection')}</Text>
            {detailRows.map((row) => (
              <View style={styles.row} key={row.key}>
                <View style={styles.rowLabelWrap}>
                  <MaterialCommunityIcons
                    name={row.icon}
                    size={spacing.md + spacing.xs}
                    color={colors.clay}
                  />
                  <Text style={styles.rowLabel}>{row.label}</Text>
                </View>
                <Text style={styles.rowValue}>{row.value}</Text>
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
              {formatShortDate(order.createdAt)}
            </Text>
          </View>
          {order.updatedAt ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('orders.updatedAt')}</Text>
              <Text style={styles.rowValue}>
                {formatShortDate(order.updatedAt)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
  priceCard: { gap: spacing.xs, borderRadius: radius.xl, ...shadows.md },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
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
    fontFamily: 'Alexandria_900Black',
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
