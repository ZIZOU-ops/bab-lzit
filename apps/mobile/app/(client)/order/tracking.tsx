import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Avatar, BackHeader, Card, LoadingScreen } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useOrder } from '../../../src/hooks/orders/useOrderQueries';
import { useOrderSocket } from '../../../src/hooks/orders/useOrderSocket';

const ACTIVE_STATUS = new Set(['accepted', 'en_route', 'in_progress']);

export default function OrderTrackingScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = params.orderId ?? '';
  const orderQuery = useOrder(orderId);

  useOrderSocket(orderId);

  if (orderQuery.isLoading || !orderQuery.data) {
    return <LoadingScreen />;
  }

  const order = orderQuery.data;

  const timeline = useMemo(() => [...order.statusEvents].sort((a, b) => a.seq - b.seq), [order.statusEvents]);
  const leadAssignment = order.assignments.find((assignment) => assignment.isLead) ?? order.assignments[0];
  const showProCard = order.status === 'en_route' || order.status === 'in_progress';

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('tracking.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.statusCard}>
          <Text style={styles.sectionLabel}>{t('tracking.currentStatus')}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.currentStatus}>{t(`orders.status.${order.status}`)}</Text>
          </View>
        </Card>

        <Card style={styles.block}>
          <Text style={styles.sectionLabel}>{t('tracking.timeline')}</Text>
          {timeline.map((event, index) => {
            const isLast = index === timeline.length - 1;
            const isActive = !isLast && ACTIVE_STATUS.has(event.toStatus);
            const isDone = !isLast && !isActive;

            return (
              <View key={event.id} style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View
                    style={[
                      styles.dot,
                      isDone && styles.dotDone,
                      isActive && styles.dotActive,
                      isLast && styles.dotPending,
                    ]}
                  />
                  {!isLast ? (
                    <View
                      style={[
                        styles.line,
                        isDone && styles.lineDone,
                        isActive && styles.lineActive,
                      ]}
                    />
                  ) : null}
                </View>

                <View style={styles.timelineText}>
                  <Text style={styles.timelineTitle}>{t(`orders.status.${event.toStatus}`)}</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(event.createdAt).toLocaleString(i18n.language, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {event.reason ? <Text style={styles.timelineReason}>{event.reason}</Text> : null}
                </View>
              </View>
            );
          })}
        </Card>

        {showProCard && leadAssignment ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('tracking.assignedPro')}</Text>
            <View style={styles.proRow}>
              <Avatar name={leadAssignment.professional.user.fullName} size="lg" />
              <View style={styles.proTextWrap}>
                <Text style={styles.proName}>{leadAssignment.professional.user.fullName}</Text>
                <Text style={styles.meta}>{t('tracking.statusLabel')}: {t(`pro.assignmentStatus.${leadAssignment.status}`)}</Text>
                <View style={styles.reliabilityRow}>
                  <Ionicons name="shield-checkmark-outline" size={spacing.md + spacing.xs} color={colors.clay} />
                  <Text style={styles.meta}>{t('tracking.reliabilityLabel')}: {Math.round(leadAssignment.professional.reliability)}%</Text>
                </View>
              </View>
            </View>
          </Card>
        ) : null}

        <Card style={styles.block}>
          <View style={styles.helpRow}>
            <MaterialCommunityIcons name="chat-processing-outline" size={spacing.md + spacing.xs} color={colors.navy} />
            <Text style={styles.meta}>{t('orders.openChat')}</Text>
          </View>
          <View style={styles.helpRow}>
            <Ionicons name="navigate-outline" size={spacing.md + spacing.xs} color={colors.navy} />
            <Text style={styles.meta}>{t('orders.trackStatus')}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
  statusCard: {
    gap: spacing.xs,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: spacing.sm + spacing.xs,
    height: spacing.sm + spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.clay,
  },
  currentStatus: {
    ...textStyles.h1,
    color: colors.navy,
  },
  block: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineColumn: {
    width: spacing.lg,
    alignItems: 'center',
  },
  dot: {
    width: spacing.sm + spacing.xs,
    height: spacing.sm + spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    backgroundColor: colors.textMuted,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.clay,
  },
  dotPending: {
    backgroundColor: colors.borderStrong,
  },
  line: {
    width: spacing.xs / spacing.xs,
    flex: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.border,
  },
  lineDone: {
    backgroundColor: colors.successA38,
  },
  lineActive: {
    backgroundColor: colors.clay,
  },
  timelineText: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  timelineTitle: {
    ...textStyles.h3,
    color: colors.navy,
  },
  timelineDate: {
    ...textStyles.body,
    color: colors.textMuted,
    fontSize: spacing.sm + spacing.xs - spacing.xs / 2,
  },
  timelineReason: {
    ...textStyles.body,
    color: colors.textSec,
    fontStyle: 'italic',
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  proTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  proName: {
    ...textStyles.h2,
    color: colors.navy,
  },
  meta: {
    ...textStyles.body,
    color: colors.textSec,
  },
  reliabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.navyTint03,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + spacing.xs,
  },
});
