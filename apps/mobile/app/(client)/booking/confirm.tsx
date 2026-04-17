import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NEIGHBORHOODS } from '@babloo/shared/pricing';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, ScreenHeader } from '../../../src/components/ui';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useCreateOrder } from '../../../src/hooks/orders/useOrderMutations';
import { clearBookingDraft, getBookingDraft } from '../../../src/state/bookingDraft';
import { getErrorMessage } from '../../../src/lib/errors';

const CITY_LABEL_KEYS = {
  rabat: 'booking.cityRabat',
  sale: 'booking.citySale',
  temara: 'booking.cityTemara',
} as const;

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

export default function BookingConfirmScreen() {
  const { t, i18n } = useTranslation();
  const draft = getBookingDraft();
  const createOrder = useCreateOrder();
  const [exactAddress, setExactAddress] = useState('');

  useEffect(() => {
    if (!draft) {
      router.replace('/(client)/booking/service');
    }
  }, [draft]);

  if (!draft) {
    return null;
  }

  const selectedNeighborhood = draft.neighborhoodId
    ? NEIGHBORHOODS.find((item) => item.id === draft.neighborhoodId) ?? null
    : null;
  const neighborhoodName = selectedNeighborhood
    ? i18n.language.startsWith('ar')
      ? selectedNeighborhood.nameAr
      : selectedNeighborhood.name
    : null;
  const neighborhoodDisplay = selectedNeighborhood
    ? `${neighborhoodName}, ${t(CITY_LABEL_KEYS[selectedNeighborhood.city])}`
    : t('booking.selectNeighborhood');
  const orderLocation = selectedNeighborhood
    ? `${exactAddress.trim()}, ${neighborhoodDisplay}`
    : exactAddress.trim();

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('booking.confirmBookingTitle')} />
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
              <Text style={styles.sectionLabel}>{t('booking.priceEstimate')}</Text>
              <Text style={styles.price}>{draft.estimate.recommendedPrice} MAD</Text>
            </View>
            <View style={styles.durationPill}>
              <Ionicons name="time-outline" size={spacing.md + spacing.xs} color={colors.clay} />
              <Text style={styles.durationText}>
                {`${formatDuration(draft.estimate.durationMinutes.min)} - ${formatDuration(
                  draft.estimate.durationMinutes.max,
                )}`}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.locationCard}>
          <Text style={styles.sectionLabel}>{t('booking.neighborhood')}</Text>
          <View style={styles.neighborhoodRow}>
            <View style={styles.neighborhoodInfo}>
              <Ionicons name="location-outline" size={spacing.md + spacing.xs} color={colors.clay} />
              <Text style={styles.neighborhoodText}>{neighborhoodDisplay}</Text>
            </View>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.changeText}>{t('booking.change')}</Text>
            </Pressable>
          </View>

          <Input
            label={t('booking.exactAddress')}
            value={exactAddress}
            onChangeText={setExactAddress}
            placeholder={t('booking.addressPlaceholder')}
            leftElement={<Ionicons name="location-outline" size={spacing.md + spacing.xs} color={colors.clay} />}
          />
        </Card>

        <Button
          variant="primary"
          label={t('booking.confirmAndSearch')}
          loading={createOrder.isPending}
          onPress={() => {
            if (!exactAddress.trim()) {
              Alert.alert(t('booking.addressRequired'), t('booking.addressRequiredMsg'));
              return;
            }

            createOrder.mutate(
              {
                serviceType: draft.serviceType,
                location: orderLocation,
                neighborhoodId: draft.neighborhoodId,
                scheduledDate: draft.schedule?.selectedDate,
                scheduledTimeSlot: draft.schedule?.selectedTimeSlot,
                demandLevel: draft.schedule?.demandLevel,
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
  content: {
    paddingTop: spacing.lg,
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
    gap: spacing.md,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  neighborhoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
  },
  neighborhoodInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  neighborhoodText: {
    ...textStyles.h3,
    color: colors.navy,
    flexShrink: 1,
  },
  changeText: {
    ...textStyles.label,
    color: colors.clay,
  },
});
