import React, { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Avatar, Badge, Button, Card, LoadingScreen } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useToggleAvailability } from '../../../src/hooks/pro/useProMutations';
import { useProOrders, useProProfile } from '../../../src/hooks/pro/useProQueries';
import { useProSocket } from '../../../src/hooks/pro/useProSocket';
import { useAuth } from '../../../src/providers/AuthProvider';

const activeStatuses = new Set(['accepted', 'en_route', 'in_progress']);

export default function ProHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const profileQuery = useProProfile();
  const ordersQuery = useProOrders();
  const toggleAvailability = useToggleAvailability();

  useProSocket();

  const pendingCount = useMemo(
    () => ordersQuery.orders.filter((order) => order.assignmentStatus === 'assigned').length,
    [ordersQuery.orders],
  );

  const activeOrders = useMemo(
    () => ordersQuery.orders.filter((order) => activeStatuses.has(order.status)),
    [ordersQuery.orders],
  );

  if (profileQuery.isLoading || ordersQuery.isLoading || !profileQuery.data) {
    return <LoadingScreen />;
  }

  const profile = profileQuery.data;
  const displayName = user?.fullName ?? t('pro.dashboardTitle');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeRow}>
            <Avatar name={displayName} size="lg" />
            <View style={styles.welcomeTextWrap}>
              <Text style={styles.welcomeTitle}>{`${t('pro.greeting')}, ${displayName}`}</Text>
              <Text style={styles.welcomeSubtitle}>{t('pro.dashboardTitle')}</Text>
            </View>
            {pendingCount > 0 ? <Badge label={t('pro.pendingAssignments', { count: pendingCount })} variant="clay" /> : null}
          </View>
        </Card>

        <Card style={styles.availabilityCard}>
          <View style={styles.availabilityHeader}>
            <Text style={styles.sectionLabel}>{t('pro.availability')}</Text>
            <Switch
              value={profile.isAvailable}
              onValueChange={(value) => toggleAvailability.mutate({ available: value })}
              thumbColor={colors.white}
              trackColor={{ false: colors.borderStrong, true: colors.clay }}
            />
          </View>
          <Text style={styles.availabilityValue}>{profile.isAvailable ? t('pro.available') : t('pro.offline')}</Text>
          <Button
            variant={profile.isAvailable ? 'outline' : 'primary'}
            label={profile.isAvailable ? t('pro.goOffline') : t('pro.goAvailable')}
            loading={toggleAvailability.isPending}
            onPress={() => toggleAvailability.mutate({ available: !profile.isAvailable })}
          />
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.statCol}>
            <Ionicons name="star" size={spacing.lg} color={colors.clay} />
            <Text style={styles.statValue}>{profile.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('pro.rating')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <MaterialCommunityIcons name="briefcase-check-outline" size={spacing.lg} color={colors.navy} />
            <Text style={styles.statValue}>{profile.totalSessions}</Text>
            <Text style={styles.statLabel}>{t('pro.sessions')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Ionicons name="shield-checkmark" size={spacing.lg} color={colors.success} />
            <Text style={styles.statValue}>{Math.round(profile.reliability)}%</Text>
            <Text style={styles.statLabel}>{t('pro.reliability')}</Text>
          </View>
        </Card>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('pro.activeMissions')}</Text>
          <Pressable style={({ pressed }) => [styles.sectionLinkWrap, pressed && styles.pressed]} onPress={() => router.push('/(pro)/order/offers')}>
            <Text style={styles.sectionLink}>{t('pro.openSlots')}</Text>
          </Pressable>
        </View>

        {activeOrders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.empty}>{t('pro.noActiveMission')}</Text>
          </Card>
        ) : (
          activeOrders.slice(0, 5).map((order) => (
            <Pressable
              key={order.id}
              style={({ pressed }) => [styles.missionCard, pressed && styles.pressed]}
              onPress={() => router.push(`/(pro)/order/${order.id}`)}
            >
              <View style={styles.missionIconWrap}>
                <MaterialCommunityIcons
                  name={
                    order.serviceType === 'menage'
                      ? 'broom'
                      : order.serviceType === 'cuisine'
                        ? 'chef-hat'
                        : 'baby-face-outline'
                  }
                  size={spacing.lg}
                  color={colors.navy}
                />
              </View>
              <View style={styles.missionTextWrap}>
                <Text style={styles.missionTitle}>{t(`booking.${order.serviceType}`)}</Text>
                <Text style={styles.missionMeta}>{order.location}</Text>
              </View>
              <Text style={styles.missionPrice}>{order.finalPrice ?? order.floorPrice} MAD</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['2xl'], gap: spacing.md },
  welcomeCard: {
    borderRadius: radius.xl,
    ...shadows.md,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  welcomeTitle: {
    ...textStyles.h2,
    color: colors.navy,
  },
  welcomeSubtitle: {
    ...textStyles.body,
    color: colors.textSec,
  },
  availabilityCard: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  availabilityValue: {
    ...textStyles.h1,
    color: colors.navy,
  },
  statsCard: {
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statDivider: {
    width: spacing.xs / spacing.xs,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  statValue: {
    ...textStyles.h2,
    color: colors.navy,
  },
  statLabel: {
    ...textStyles.body,
    color: colors.textMuted,
    fontSize: spacing.sm + spacing.xs - spacing.xs / 2,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...textStyles.h2, color: colors.navy },
  sectionLinkWrap: {
    borderRadius: radius.full,
    backgroundColor: colors.clayTint,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + spacing.xs,
  },
  sectionLink: {
    ...textStyles.h3,
    color: colors.clay,
  },
  missionCard: {
    borderRadius: radius.xl,
    borderWidth: spacing.xs / spacing.xs,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  missionIconWrap: {
    width: spacing['2xl'] + spacing.sm,
    height: spacing['2xl'] + spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  missionTitle: {
    ...textStyles.h3,
    color: colors.navy,
  },
  missionMeta: {
    ...textStyles.body,
    color: colors.textSec,
  },
  missionPrice: {
    ...textStyles.h3,
    color: colors.clay,
  },
  emptyCard: {
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  empty: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
