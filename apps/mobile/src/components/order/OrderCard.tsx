import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, textStyles } from '../../constants/theme';
import { formatShortDate } from '../../lib/date';
import { Card } from '../ui';
import { CleaningModeGlyph } from './CleaningModeGlyph';
import { PriceDisplay } from './PriceDisplay';
import { StatusBadge } from './StatusBadge';
import { getCleaningOrderMode, type ClientOrderItem } from './orderListItem';

type OrderCardProps = {
  order: ClientOrderItem;
  onPress: () => void;
  ctaLabel?: string;
};

export function OrderCard({ order, onPress, ctaLabel }: OrderCardProps) {
  const { t } = useTranslation();
  const cleaningMode = getCleaningOrderMode(order);

  return (
    <Pressable style={({ pressed }) => [styles.pressable, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.top}>
          <View style={styles.leftTop}>
            <View
              style={[
                styles.iconWrap,
                cleaningMode === 'standard'
                  ? styles.iconWrapStandard
                  : styles.iconWrapBlue,
              ]}
            >
              <CleaningModeGlyph mode={cleaningMode} size={spacing.xl + spacing.xs} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{t(`booking.${order.serviceType}`)}</Text>
              <Text style={styles.date}>
                {formatShortDate(order.createdAt)}
              </Text>
            </View>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {order.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={spacing.md + spacing.xs} color={colors.clay} />
            <Text style={styles.location}>{order.location}</Text>
          </View>
        ) : null}

        <View style={styles.bottom}>
          <PriceDisplay floorPrice={order.floorPrice} finalPrice={order.finalPrice} />
          <View style={styles.detailLinkWrap}>
            <Text style={styles.detailLink}>{ctaLabel ?? t('orders.viewDetails')}</Text>
            <Ionicons name="chevron-forward" size={spacing.md + spacing.xs} color={colors.clay} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.md,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  card: {
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  leftTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: spacing['2xl'] + spacing.sm,
    height: spacing['2xl'] + spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapStandard: {
    backgroundColor: '#F4D7CE',
  },
  iconWrapBlue: {
    backgroundColor: '#D8DEFF',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...textStyles.h3,
    color: colors.navy,
  },
  date: {
    ...textStyles.body,
    color: colors.textMuted,
    fontSize: spacing.sm + spacing.xs - spacing.xs / 2,
  },
  locationRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    ...textStyles.body,
    color: colors.textSec,
    flex: 1,
  },
  bottom: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailLink: {
    ...textStyles.h3,
    color: colors.clay,
  },
});
