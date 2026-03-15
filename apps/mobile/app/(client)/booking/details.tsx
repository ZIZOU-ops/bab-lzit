import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pricingEstimateSchema } from '@babloo/shared';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { BackHeader, Button, Card, LoadingScreen } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { trpc } from '../../../src/lib/trpc';
import { setBookingDraft } from '../../../src/state/bookingDraft';

const serviceSchema = z.enum(['menage', 'cuisine', 'childcare']);
type PricingEstimateInput = z.infer<typeof pricingEstimateSchema>;

const SURFACE_MIN = 20;
const SURFACE_MAX = 300;

type OptionButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function OptionButton({ label, active, onPress }: OptionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.optionButton, active && styles.optionButtonActive, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function BookingDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ serviceType?: string }>();
  const parsedService = serviceSchema.safeParse(params.serviceType);

  const serviceType = parsedService.success ? parsedService.data : null;

  const [surface, setSurface] = useState('80');
  const [cleanType, setCleanType] = useState<'simple' | 'deep'>('simple');
  const [teamType, setTeamType] = useState<'solo' | 'duo' | 'squad'>('duo');
  const [guests, setGuests] = useState('6');
  const [children, setChildren] = useState('2');
  const [hours, setHours] = useState('3');

  const surfaceValue = useMemo(() => {
    const parsed = Number(surface);
    if (Number.isNaN(parsed)) {
      return 80;
    }
    return Math.min(SURFACE_MAX, Math.max(SURFACE_MIN, parsed));
  }, [surface]);

  const pricingInput = useMemo<PricingEstimateInput | null>(() => {
    if (!serviceType) {
      return null;
    }

    if (serviceType === 'menage') {
      return {
        serviceType,
        surface: Number(surface) || 80,
        cleanType,
        teamType,
      };
    }

    if (serviceType === 'cuisine') {
      return {
        serviceType,
        guests: Number(guests) || 1,
      };
    }

    return {
      serviceType,
      children: Number(children) || 1,
      hours: Number(hours) || 1,
    };
  }, [children, cleanType, guests, hours, serviceType, surface, teamType]);

  const estimateQuery = trpc.pricing.estimate.useQuery(pricingInput as PricingEstimateInput, {
    enabled: Boolean(pricingInput),
  });

  if (!serviceType) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('booking.detailsTitle')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.serviceBadgeCard}>
          <View style={styles.serviceBadgeIconWrap}>
            <MaterialCommunityIcons
              name={serviceType === 'menage' ? 'broom' : serviceType === 'cuisine' ? 'chef-hat' : 'baby-face-outline'}
              size={spacing.lg + spacing.sm}
              color={colors.navy}
            />
          </View>
          <View style={styles.serviceBadgeTextWrap}>
            <Text style={styles.sectionLabel}>{t('booking.serviceLabel')}</Text>
            <Text style={styles.serviceBadgeTitle}>{t(`booking.${serviceType}`)}</Text>
          </View>
        </Card>

        {serviceType === 'menage' ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('booking.surface')}</Text>
            <Text style={styles.surfaceValue}>{surfaceValue} m²</Text>
            <Slider
              style={styles.slider}
              minimumValue={SURFACE_MIN}
              maximumValue={SURFACE_MAX}
              step={5}
              value={surfaceValue}
              onValueChange={(value) => setSurface(String(Math.round(value)))}
              minimumTrackTintColor={colors.navy}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.clay}
            />

            <Text style={styles.sectionLabel}>{t('booking.cleanType')}</Text>
            <View style={styles.rowTwo}>
              <OptionButton label={t('booking.simple')} active={cleanType === 'simple'} onPress={() => setCleanType('simple')} />
              <OptionButton label={t('booking.deep')} active={cleanType === 'deep'} onPress={() => setCleanType('deep')} />
            </View>

            <Text style={styles.sectionLabel}>{t('booking.team')}</Text>
            <View style={styles.rowThree}>
              <OptionButton label={t('booking.solo')} active={teamType === 'solo'} onPress={() => setTeamType('solo')} />
              <OptionButton label={t('booking.duo')} active={teamType === 'duo'} onPress={() => setTeamType('duo')} />
              <OptionButton label={t('booking.squad')} active={teamType === 'squad'} onPress={() => setTeamType('squad')} />
            </View>
          </Card>
        ) : null}

        {serviceType === 'cuisine' ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('booking.guests')}</Text>
            <View style={styles.rowThree}>
              {[4, 6, 8].map((count) => (
                <OptionButton
                  key={count}
                  label={`${count}`}
                  active={Number(guests) === count}
                  onPress={() => setGuests(String(count))}
                />
              ))}
            </View>
          </Card>
        ) : null}

        {serviceType === 'childcare' ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('booking.children')}</Text>
            <View style={styles.rowThree}>
              {[1, 2, 3].map((count) => (
                <OptionButton
                  key={count}
                  label={`${count}`}
                  active={Number(children) === count}
                  onPress={() => setChildren(String(count))}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>{t('booking.hours')}</Text>
            <View style={styles.rowThree}>
              {[2, 3, 4].map((count) => (
                <OptionButton
                  key={count}
                  label={`${count}`}
                  active={Number(hours) === count}
                  onPress={() => setHours(String(count))}
                />
              ))}
            </View>
          </Card>
        ) : null}

        <Card style={styles.estimateCard}>
          <Text style={styles.estimateTitle}>{t('booking.priceEstimate')}</Text>
          {estimateQuery.isLoading ? (
            <Text style={styles.estimateValue}>{t('booking.calculating')}</Text>
          ) : (
            <>
              <Text style={styles.estimateValue}>{estimateQuery.data?.floorPrice ?? 0} MAD</Text>
              <Text style={styles.estimateMeta}>
                {t('booking.ceiling')}: {estimateQuery.data?.ceilingPrice ?? 0} MAD
              </Text>
            </>
          )}
        </Card>

        <Button
          variant="primary"
          label={t('booking.continue')}
          onPress={() => {
            if (!pricingInput || !estimateQuery.data) {
              return;
            }

            const detail =
              serviceType === 'menage'
                ? {
                    serviceType,
                    surface: Number(surface) || 80,
                    cleanType,
                    teamType,
                  }
                : serviceType === 'cuisine'
                  ? {
                      serviceType,
                      guests: Number(guests) || 1,
                    }
                  : {
                      serviceType,
                      children: Number(children) || 1,
                      hours: Number(hours) || 1,
                    };

            setBookingDraft({
              serviceType,
              detail,
              estimate: {
                floorPrice: estimateQuery.data.floorPrice,
                ceilingPrice: estimateQuery.data.ceilingPrice,
                ceiling: estimateQuery.data.ceilingPrice,
                durationMinutes: estimateQuery.data.durationMinutes,
              },
            });

            router.push('/(client)/booking/confirm');
          }}
          disabled={!estimateQuery.data}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  serviceBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  serviceBadgeIconWrap: {
    width: spacing['2xl'] + spacing.md,
    height: spacing['2xl'] + spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBadgeTextWrap: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  serviceBadgeTitle: {
    ...textStyles.h2,
    color: colors.navy,
  },
  block: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  surfaceValue: {
    ...textStyles.display,
    color: colors.navy,
    fontSize: spacing['2xl'],
    lineHeight: spacing['2xl'] + spacing.sm,
  },
  slider: {
    width: '100%',
    height: spacing['2xl'] + spacing.md,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowThree: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: spacing.xs / spacing.xs,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: spacing.sm + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navyTint07,
  },
  optionLabel: {
    ...textStyles.h3,
    color: colors.textSec,
  },
  optionLabelActive: {
    color: colors.navy,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  estimateCard: {
    gap: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    ...shadows.md,
  },
  estimateTitle: {
    ...textStyles.label,
    color: colors.whiteA70,
  },
  estimateValue: {
    ...textStyles.display,
    color: colors.white,
    fontSize: spacing['2xl'],
    lineHeight: spacing['2xl'] + spacing.sm,
  },
  estimateMeta: {
    ...textStyles.body,
    color: colors.whiteA70,
  },
});
