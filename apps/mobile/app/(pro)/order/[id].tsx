import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, LoadingScreen, ScreenHeader } from '../../../src/components/ui';
import { StatusBadge } from '../../../src/components/order';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import {
  useConfirmAssignment,
  useDeclineAssignment,
  useUpdateOrderStatus,
} from '../../../src/hooks/pro/useProMutations';
import { useOrder } from '../../../src/hooks/orders/useOrderQueries';
import { formatShortDate } from '../../../src/lib/date';
import { getErrorMessage } from '../../../src/lib/errors';

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

export default function ProOrderDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = params.id ?? '';
  const orderQuery = useOrder(orderId);

  const updateStatus = useUpdateOrderStatus();
  const confirmAssignment = useConfirmAssignment();
  const declineAssignment = useDeclineAssignment();

  if (orderQuery.isLoading || !orderQuery.data) {
    return <LoadingScreen />;
  }

  const order = orderQuery.data;
  const leadAssignment = order.assignments.find((assignment) => assignment.isLead);
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
              defaultValue: field.key === 'squadSize' ? 'Team size' : field.key,
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
      <ScreenHeader title={t('pro.missionDetails')} rightElement={<StatusBadge status={order.status} />} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceIconWrap}>
              <MaterialCommunityIcons
                name={
                  order.serviceType === 'menage'
                    ? 'broom'
                    : order.serviceType === 'cuisine'
                      ? 'chef-hat'
                      : 'baby-face-outline'
                }
                size={spacing.lg + spacing.xs}
                color={colors.navy}
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>{t(`booking.${order.serviceType}`)}</Text>
              <Text style={styles.meta}>{t('orders.price')}: {order.finalPrice ?? order.floorPrice} MAD</Text>
            </View>
          </View>
        </Card>

        {detailRows.length > 0 ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('orders.detailsSection')}</Text>
            {detailRows.map((row) => (
              <View style={styles.row} key={row.key}>
                <MaterialCommunityIcons name={row.icon} size={spacing.md + spacing.xs} color={colors.clay} />
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card style={styles.block}>
          <Text style={styles.sectionLabel}>{t('orders.addressSection')}</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="map-marker-outline" size={spacing.md + spacing.xs} color={colors.clay} />
            <Text style={styles.meta}>{order.location}</Text>
          </View>
        </Card>

        <Card style={styles.block}>
          <Text style={styles.sectionLabel}>{t('orders.datesSection')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('orders.createdAt')}</Text>
            <Text style={styles.rowValue}>{formatShortDate(order.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('orders.updatedAt')}</Text>
            <Text style={styles.rowValue}>{formatShortDate(order.updatedAt)}</Text>
          </View>
        </Card>

        {notesValue ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('orders.notesSection')}</Text>
            <Text style={styles.meta}>{notesValue}</Text>
          </Card>
        ) : null}

        <Button
          variant="primary"
          label={t('orders.openChat')}
          icon={<Ionicons name="chatbubble-ellipses-outline" size={spacing.md + spacing.xs} color={colors.white} />}
          onPress={() =>
            router.push({
              pathname: '/(pro)/order/chat',
              params: { orderId },
            })
          }
        />

        <Button
          variant="outline"
          label={t('pro.openSlotsJoinRequests')}
          icon={<MaterialCommunityIcons name="account-group-outline" size={spacing.md + spacing.xs} color={colors.navy} />}
          onPress={() => router.push('/(pro)/order/offers')}
        />

        {leadAssignment?.status === 'assigned' ? (
          <Button
            variant="primary"
            label={t('pro.confirmAssignment')}
            loading={confirmAssignment.isPending}
            onPress={() => {
              confirmAssignment.mutate(
                { assignmentId: leadAssignment.id },
                {
                  onError(error) {
                    Alert.alert(t('common.error'), getErrorMessage(error, t('pro.confirmAssignmentError')));
                  },
                  async onSuccess() {
                    await orderQuery.refetch();
                  },
                },
              );
            }}
          />
        ) : null}

        {leadAssignment?.status === 'assigned' ? (
          <Button
            variant="clay"
            label={t('pro.declineAssignment')}
            loading={declineAssignment.isPending}
            onPress={() => {
              declineAssignment.mutate(
                { assignmentId: leadAssignment.id },
                {
                  onError(error) {
                    Alert.alert(t('common.error'), getErrorMessage(error, t('pro.declineAssignmentError')));
                  },
                  async onSuccess() {
                    await orderQuery.refetch();
                  },
                },
              );
            }}
          />
        ) : null}

        {order.status === 'accepted' ? (
          <Button
            variant="primary"
            label={t('pro.setEnRoute')}
            loading={updateStatus.isPending}
            onPress={() => {
              updateStatus.mutate(
                {
                  orderId,
                  status: 'en_route',
                },
                {
                  onError(error) {
                    Alert.alert(t('common.error'), getErrorMessage(error, t('pro.updateStatusError')));
                  },
                  async onSuccess() {
                    await orderQuery.refetch();
                  },
                },
              );
            }}
          />
        ) : null}

        {order.status === 'en_route' ? (
          <Button
            variant="primary"
            label={t('pro.setInProgress')}
            loading={updateStatus.isPending}
            onPress={() => {
              updateStatus.mutate(
                {
                  orderId,
                  status: 'in_progress',
                },
                {
                  onError(error) {
                    Alert.alert(t('common.error'), getErrorMessage(error, t('pro.updateStatusError')));
                  },
                  async onSuccess() {
                    await orderQuery.refetch();
                  },
                },
              );
            }}
          />
        ) : null}

        {order.status === 'in_progress' ? (
          <Button
            variant="primary"
            label={t('pro.setCompleted')}
            loading={updateStatus.isPending}
            onPress={() => {
              updateStatus.mutate(
                {
                  orderId,
                  status: 'completed',
                },
                {
                  onError(error) {
                    Alert.alert(t('common.error'), getErrorMessage(error, t('pro.updateStatusError')));
                  },
                  async onSuccess() {
                    await orderQuery.refetch();
                  },
                },
              );
            }}
          />
        ) : null}
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.whiteA12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.8,
  },
  headerTitle: {
    fontFamily: fonts.nunito.bold,
    fontSize: 20,
    color: colors.white,
    flex: 1,
  },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
  serviceCard: {
    borderRadius: radius.xl,
    ...shadows.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceIconWrap: {
    width: spacing['2xl'] + spacing.sm,
    height: spacing['2xl'] + spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  serviceTitle: {
    ...textStyles.h1,
    color: colors.navy,
  },
  block: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  meta: { ...textStyles.body, color: colors.textSec },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLabel: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  rowValue: {
    ...textStyles.body,
    color: colors.navy,
    marginLeft: 'auto',
    textAlign: 'right',
    flexShrink: 1,
  },
});
