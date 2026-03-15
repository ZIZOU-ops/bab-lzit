import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BackHeader, Button, Card, Input } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useCreateOrder } from '../../../src/hooks/orders/useOrderMutations';
import { clearBookingDraft, getBookingDraft } from '../../../src/state/bookingDraft';
import { getErrorMessage } from '../../../src/lib/errors';

export default function BookingConfirmScreen() {
  const { t } = useTranslation();
  const draft = getBookingDraft();
  const createOrder = useCreateOrder();
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!draft) {
      router.replace('/(client)/booking/service');
    }
  }, [draft]);

  if (!draft) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('booking.confirmBookingTitle')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>{t('booking.serviceLabel')}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <MaterialCommunityIcons
                name={
                  draft.serviceType === 'menage'
                    ? 'broom'
                    : draft.serviceType === 'cuisine'
                      ? 'chef-hat'
                      : 'baby-face-outline'
                }
                size={spacing.lg + spacing.xs}
                color={colors.navy}
              />
            </View>
            <Text style={styles.summaryValue}>{t(`booking.${draft.serviceType}`)}</Text>
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.sectionLabel}>{t('orders.floorPrice')}</Text>
              <Text style={styles.price}>{draft.estimate.floorPrice} MAD</Text>
            </View>
            <View style={styles.durationPill}>
              <Ionicons name="time-outline" size={spacing.md + spacing.xs} color={colors.clay} />
              <Text style={styles.durationText}>
                {`${draft.estimate.durationMinutes.min}-${draft.estimate.durationMinutes.max} min`}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.locationCard}>
          <Input
            label={t('booking.address')}
            value={location}
            onChangeText={setLocation}
            placeholder={t('booking.addressPlaceholder')}
            leftElement={<Ionicons name="location-outline" size={spacing.md + spacing.xs} color={colors.clay} />}
          />
        </Card>

        <Button
          variant="primary"
          label={t('booking.confirmAndSearch')}
          loading={createOrder.isPending}
          onPress={() => {
            if (!location.trim()) {
              Alert.alert(t('booking.addressRequired'), t('booking.addressRequiredMsg'));
              return;
            }

            createOrder.mutate(
              {
                serviceType: draft.serviceType,
                location: location.trim(),
                detail: draft.detail as never,
              },
              {
                onSuccess(order) {
                  clearBookingDraft();
                  router.replace({
                    pathname: '/(client)/booking/search',
                    params: { orderId: order.id },
                  });
                },
                onError(error) {
                  Alert.alert(t('booking.bookingFailedTitle'), getErrorMessage(error, t('booking.bookingFailedMessage')));
                },
              },
            );
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  summaryCard: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryIconWrap: {
    width: spacing['2xl'] + spacing.sm,
    height: spacing['2xl'] + spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    ...textStyles.h2,
    color: colors.navy,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  price: {
    ...textStyles.display,
    color: colors.navy,
    fontSize: spacing['2xl'],
    lineHeight: spacing['2xl'] + spacing.sm,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.clayTint,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + spacing.xs,
  },
  durationText: {
    ...textStyles.h3,
    color: colors.clay,
  },
  locationCard: {
    borderRadius: radius.xl,
    ...shadows.sm,
  },
});
