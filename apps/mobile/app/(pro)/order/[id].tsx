import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BackHeader, Button, Card, LoadingScreen } from '../../../src/components/ui';
import { StatusBadge } from '../../../src/components/order';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import {
  useConfirmAssignment,
  useDeclineAssignment,
  useUpdateOrderStatus,
} from '../../../src/hooks/pro/useProMutations';
import { useOrder } from '../../../src/hooks/orders/useOrderQueries';
import { getErrorMessage } from '../../../src/lib/errors';

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

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('pro.missionDetails')} rightElement={<StatusBadge status={order.status} />} />
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

        <Card style={styles.block}>
          <Text style={styles.sectionLabel}>{t('orders.detailsSection')}</Text>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={spacing.md + spacing.xs} color={colors.clay} />
            <Text style={styles.rowLabel}>{t('pro.clientId')}</Text>
            <Text style={styles.rowValue}>{order.clientId}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={spacing.md + spacing.xs} color={colors.clay} />
            <Text style={styles.rowLabel}>{t('orders.location')}</Text>
            <Text style={styles.rowValue}>{order.location}</Text>
          </View>
          {order.detail
            ? Object.entries(order.detail).map(([key, value]) => (
                <View style={styles.row} key={key}>
                  <MaterialCommunityIcons name="dots-grid" size={spacing.md + spacing.xs} color={colors.clay} />
                  <Text style={styles.rowLabel}>{t(`booking.${key}`, { defaultValue: key })}</Text>
                  <Text style={styles.rowValue}>{String(value ?? t('common.notAvailable'))}</Text>
                </View>
              ))
            : null}
        </Card>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
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
