import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, textStyles } from '../../constants/theme';
import { Card } from '../ui';
import { PriceDisplay } from './PriceDisplay';
import { StatusBadge } from './StatusBadge';

type OrderCardProps = {
  order: {
    id: string;
    serviceType: string;
    status: string;
    floorPrice: number;
    finalPrice?: number | null;
    createdAt: string | Date;
    location?: string;
  };
  onPress: () => void;
};

function getServiceIcon(serviceType: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  if (serviceType === 'menage') return 'broom';
  if (serviceType === 'cuisine') return 'chef-hat';
  return 'baby-face-outline';
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <Pressable style={({ pressed }) => [styles.pressable, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.top}>
          <View style={styles.leftTop}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={getServiceIcon(order.serviceType)} size={spacing.md + spacing.xs} color={colors.navy} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{t(`booking.${order.serviceType}`)}</Text>
              <Text style={styles.date}>
                {new Date(order.createdAt).toLocaleDateString(i18n.language, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
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
            <Text style={styles.detailLink}>{t('orders.viewDetails')}</Text>
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
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
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
