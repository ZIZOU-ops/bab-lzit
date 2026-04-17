import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pricingEstimateSchema } from '@babloo/shared';
import {
  DEFAULT_DEMAND_LEVEL,
  getDemandMultiplier,
  type DemandLevel,
  type TimeSlotKey,
} from '@babloo/shared/pricing';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  Button,
  Card,
  Input,
  LoadingScreen,
  NeighborhoodPicker,
  ScreenHeader,
} from '../../../src/components/ui';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { trpc } from '../../../src/lib/trpc';
import {
  getBookingNeighborhoodId,
  setBookingDraft,
  setBookingNeighborhoodId,
} from '../../../src/state/bookingDraft';

const serviceSchema = z.enum(['menage', 'cuisine', 'childcare']);
type PricingEstimateInput = z.infer<typeof pricingEstimateSchema>;

const SURFACE_MIN = 20;
const SURFACE_MAX = 500;
const SURFACE_ABSOLUTE_MAX = 1000;

type PropertyType = 'apartment' | 'villa' | 'riad' | 'office';
type FloorsValue = '1' | '2' | '3+';
type MealType = 'daily' | 'reception' | 'party';
type GuestsValue = '4' | '6' | '8' | '12' | '20+';
type SquadSize = '3' | '4' | '5';

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

function getRecommendedTeamType(
  surface: number,
  propertyType: PropertyType,
  _cleanType: 'simple' | 'deep',
  floors: number,
): 'solo' | 'duo' | 'squad' {
  const SOLO_COEFF = 17;
  const EXPONENT = 0.45;
  const LABOR_FLOOR = 120;
  const PROP_MULT: Record<PropertyType, number> = {
    apartment: 1.0,
    villa: 1.3,
    riad: 1.2,
    office: 0.9,
  };
  const FLOORS_MULT: Record<number, number> = { 1: 1.0, 2: 1.15, 3: 1.25 };

  let jobValue = Math.round(SOLO_COEFF * Math.pow(surface, EXPONENT));
  const nFloors = Math.min(3, Math.max(1, floors));
  jobValue = Math.round(
    jobValue * (PROP_MULT[propertyType] ?? 1.0) * (FLOORS_MULT[nFloors] ?? 1.0),
  );

  if (jobValue > 3 * LABOR_FLOOR) return 'squad';
  if (jobValue > 2 * LABOR_FLOOR) return 'duo';
  return 'solo';
}

function getRecommendedSquadSize(
  surface: number,
  propertyType: PropertyType,
  _cleanType: 'simple' | 'deep',
  floors: number,
): '3' | '4' | '5' {
  const SQUAD_COEFF = 32;
  const EXPONENT = 0.45;
  const LABOR_FLOOR = 120;
  const PROP_MULT: Record<PropertyType, number> = {
    apartment: 1.0,
    villa: 1.3,
    riad: 1.2,
    office: 0.9,
  };
  const FLOORS_MULT: Record<number, number> = { 1: 1.0, 2: 1.15, 3: 1.25 };

  let jobValue = Math.round(SQUAD_COEFF * Math.pow(surface, EXPONENT));
  const nFloors = Math.min(3, Math.max(1, floors));
  jobValue = Math.round(
    jobValue * (PROP_MULT[propertyType] ?? 1.0) * (FLOORS_MULT[nFloors] ?? 1.0),
  );

  if (jobValue > 5 * LABOR_FLOOR) return '5';
  if (jobValue > 4 * LABOR_FLOOR) return '4';
  return '3';
}

function getGuestsCount(guests: GuestsValue) {
  return guests === '20+' ? 20 : Number(guests);
}

function getFloorsCount(floors: FloorsValue) {
  return floors === '3+' ? 3 : Number(floors);
}

/** Breathing pulse on price text while recalculating */
function PulsePrice({ style }: { style: any }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.Text style={[style, { opacity, fontSize: 28, letterSpacing: 6 }]}>
      ● ● ●
    </Animated.Text>
  );
}

export default function BookingDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    serviceType?: string;
    neighborhoodId?: string;
    selectedDate?: string;
    selectedTimeSlot?: string;
    demandLevel?: string;
    cleanType?: string;
  }>();
  const parsedService = serviceSchema.safeParse(params.serviceType);
  const routeNeighborhoodId =
    typeof params.neighborhoodId === 'string'
      ? params.neighborhoodId
      : getBookingNeighborhoodId() ?? undefined;
  const selectedDate =
    typeof params.selectedDate === 'string' ? params.selectedDate : undefined;
  const selectedTimeSlot =
    typeof params.selectedTimeSlot === 'string'
      ? (params.selectedTimeSlot as TimeSlotKey)
      : undefined;
  const demandLevel =
    typeof params.demandLevel === 'string'
      ? (params.demandLevel as DemandLevel)
      : DEFAULT_DEMAND_LEVEL;
  const routeCleanType =
    params.cleanType === 'simple' || params.cleanType === 'deep' ? params.cleanType : undefined;

  const serviceType = parsedService.success ? parsedService.data : null;
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | undefined>(
    routeNeighborhoodId,
  );

  useEffect(() => {
    if (serviceType && (!selectedDate || !selectedTimeSlot)) {
      router.replace({
        pathname: '/(client)/booking/schedule',
        params: {
          serviceType,
          ...(selectedNeighborhoodId ? { neighborhoodId: selectedNeighborhoodId } : {}),
          ...(routeCleanType ? { cleanType: routeCleanType } : {}),
        },
      });
    }
  }, [routeCleanType, selectedDate, selectedNeighborhoodId, selectedTimeSlot, serviceType]);

  // Only sync from route params on initial mount or when route params actually change
  const prevRouteNeighborhoodId = useRef(routeNeighborhoodId);
  useEffect(() => {
    if (routeNeighborhoodId && routeNeighborhoodId !== prevRouteNeighborhoodId.current) {
      setSelectedNeighborhoodId(routeNeighborhoodId);
    }
    prevRouteNeighborhoodId.current = routeNeighborhoodId;
  }, [routeNeighborhoodId]);

  const [surface, setSurface] = useState('80');
  const [customSurface, setCustomSurface] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [cleanType, setCleanType] = useState<'simple' | 'deep' | null>(routeCleanType ?? null);
  const [teamType, setTeamType] = useState<'solo' | 'duo' | 'squad' | null>(null);
  const [teamManuallySet, setTeamManuallySet] = useState(false);
  const [squadSize, setSquadSize] = useState<SquadSize | null>(null);
  const [floors, setFloors] = useState<FloorsValue | null>(null);
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [guests, setGuests] = useState<GuestsValue | null>(null);
  const [children, setChildren] = useState<string | null>(null);
  const [hours, setHours] = useState<string | null>(null);

  const surfaceSliderValue = useMemo(() => {
    const parsed = Number(surface);
    if (Number.isNaN(parsed)) {
      return 80;
    }
    return Math.min(SURFACE_MAX, Math.max(SURFACE_MIN, parsed));
  }, [surface]);

  const surfaceValue = useMemo(() => {
    if (!customSurface.trim()) {
      return surfaceSliderValue;
    }

    const parsed = Number(customSurface);
    if (Number.isNaN(parsed)) {
      return surfaceSliderValue;
    }

    return Math.min(SURFACE_ABSOLUTE_MAX, Math.max(SURFACE_MAX, parsed));
  }, [customSurface, surfaceSliderValue]);

  const showSurfaceContactUs = useMemo(() => {
    const parsed = Number(customSurface);
    return !Number.isNaN(parsed) && parsed > SURFACE_ABSOLUTE_MAX;
  }, [customSurface]);

  // Whether enough fields are filled to proceed (continue button)
  const canProceed = useMemo(() => {
    if (serviceType === 'menage') {
      return (
        propertyType !== null &&
        cleanType !== null &&
        teamType !== null &&
        (surfaceValue <= 100 || floors !== null) &&
        (teamType !== 'squad' || squadSize !== null)
      );
    }

    if (serviceType === 'cuisine') {
      return mealType !== null && guests !== null;
    }

    if (serviceType === 'childcare') {
      return children !== null && hours !== null;
    }

    return false;
  }, [
    children,
    cleanType,
    floors,
    guests,
    hours,
    mealType,
    propertyType,
    serviceType,
    squadSize,
    surfaceValue,
    teamType,
  ]);

  // Whether to show single price (team was explicitly chosen for ménage)
  const allFieldsFilled = canProceed && (serviceType !== 'menage' || teamManuallySet);

  const updateTeamType = (
    nextTeamType: 'solo' | 'duo' | 'squad',
    nextSurface = surfaceValue,
    nextPropertyType = propertyType,
    nextCleanType = cleanType,
    nextFloors: FloorsValue | null = surfaceValue > 100 ? floors : null,
  ) => {
    setTeamType(nextTeamType);
    if (nextTeamType === 'squad') {
      setSquadSize(null);
      return;
    }
    setSquadSize(null);
  };

  const updateRecommendation = (
    nextSurface: number,
    nextPropertyType: PropertyType | null,
    nextCleanType: 'simple' | 'deep' | null,
    nextFloors: FloorsValue | null,
  ) => {
    const normalizedFloors = nextSurface > 100 ? nextFloors : null;
    if (normalizedFloors !== floors) {
      setFloors(normalizedFloors);
    }

    if (nextPropertyType && nextCleanType && teamType === null) {
      const recommendedTeamType = getRecommendedTeamType(
        nextSurface,
        nextPropertyType,
        nextCleanType,
        getFloorsCount(normalizedFloors ?? '1'),
      );
      setTeamType(recommendedTeamType);
    }
  };

  const pricingInput = useMemo<PricingEstimateInput | null>(() => {
    if (!serviceType) {
      return null;
    }

    if (serviceType === 'menage') {
      const effectivePropertyType = propertyType ?? 'apartment';
      const effectiveCleanType = cleanType ?? 'simple';
      const effectiveTeamType = teamType ?? 'solo';
      const effectiveFloors = floors ?? '1';
      return {
        serviceType,
        ...(selectedNeighborhoodId ? { neighborhoodId: selectedNeighborhoodId } : {}),
        demandLevel,
        surface: surfaceValue,
        cleanType: effectiveCleanType,
        teamType: effectiveTeamType,
        ...(effectiveTeamType === 'squad' ? { squadSize: Number(squadSize ?? '3') } : {}),
        propertyType: effectivePropertyType,
        floors: getFloorsCount(surfaceValue > 100 ? effectiveFloors : '1'),
      };
    }

    if (serviceType === 'cuisine') {
      const effectiveMealType = mealType ?? 'daily';
      const effectiveGuests = guests ?? '6';
      return {
        serviceType,
        ...(selectedNeighborhoodId ? { neighborhoodId: selectedNeighborhoodId } : {}),
        demandLevel,
        guests: getGuestsCount(effectiveGuests) || 1,
        mealType: effectiveMealType,
      };
    }

    const effectiveChildren = children ?? '2';
    const effectiveHours = hours ?? '3';
    return {
      serviceType,
      ...(selectedNeighborhoodId ? { neighborhoodId: selectedNeighborhoodId } : {}),
      demandLevel,
      children: Number(effectiveChildren) || 1,
      hours: Number(effectiveHours) || 1,
    };
  }, [children, cleanType, demandLevel, floors, guests, hours, mealType, propertyType, selectedNeighborhoodId, serviceType, squadSize, surfaceValue, teamType]);

  const pricingInputLow = useMemo<PricingEstimateInput | null>(() => {
    if (!serviceType || serviceType !== 'menage') {
      return null;
    }

    const lowTeamType = teamType ?? 'solo';
    return {
      serviceType,
      ...(selectedNeighborhoodId ? { neighborhoodId: selectedNeighborhoodId } : {}),
      demandLevel,
      surface: surfaceValue,
      propertyType: propertyType ?? 'office',
      cleanType: cleanType ?? 'simple',
      teamType: lowTeamType,
      ...(lowTeamType === 'squad' ? { squadSize: Number(squadSize ?? '3') } : {}),
      floors: getFloorsCount(surfaceValue > 100 ? (floors ?? '1') : '1'),
    };
  }, [
    cleanType,
    demandLevel,
    floors,
    propertyType,
    selectedNeighborhoodId,
    serviceType,
    squadSize,
    surfaceValue,
    teamType,
  ]);

  const pricingInputHigh = useMemo<PricingEstimateInput | null>(() => {
    if (!serviceType || serviceType !== 'menage') {
      return null;
    }

    const highTeamType = teamType ?? 'squad';
    return {
      serviceType,
      ...(selectedNeighborhoodId ? { neighborhoodId: selectedNeighborhoodId } : {}),
      demandLevel,
      surface: surfaceValue,
      propertyType: propertyType ?? 'villa',
      cleanType: cleanType ?? 'deep',
      teamType: highTeamType,
      ...(highTeamType === 'squad' ? { squadSize: Number(squadSize ?? '5') } : {}),
      floors: getFloorsCount(surfaceValue > 100 ? (floors ?? '3+') : '1'),
    };
  }, [
    cleanType,
    demandLevel,
    floors,
    propertyType,
    selectedNeighborhoodId,
    serviceType,
    squadSize,
    surfaceValue,
    teamType,
  ]);

  // For ménage: show range only after propertyType is picked but not all fields filled
  // For cuisine: after mealType, for childcare: after children
  const hasMinSelection =
    serviceType === 'menage'
      ? cleanType !== null && propertyType !== null
      : serviceType === 'cuisine'
        ? mealType !== null
        : children !== null;

  const showPriceRange = serviceType === 'menage' && hasMinSelection && !allFieldsFilled;

  const estimateQuery = trpc.pricing.estimate.useQuery(pricingInput as PricingEstimateInput, {
    enabled: Boolean(pricingInput),
  });

  const estimateLowQuery = trpc.pricing.estimate.useQuery(
    pricingInputLow as PricingEstimateInput,
    {
      enabled: Boolean(pricingInputLow) && hasMinSelection && !allFieldsFilled,
    },
  );

  const estimateHighQuery = trpc.pricing.estimate.useQuery(
    pricingInputHigh as PricingEstimateInput,
    {
      enabled: Boolean(pricingInputHigh) && hasMinSelection && !allFieldsFilled,
    },
  );

  // ── Shimmer on spec change ──
  const [recalculating, setRecalculating] = useState(false);
  const recalcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pricingKey = JSON.stringify(pricingInput);

  useEffect(() => {
    setRecalculating(true);
    if (recalcTimer.current) clearTimeout(recalcTimer.current);
    recalcTimer.current = setTimeout(() => setRecalculating(false), 1200);
    return () => {
      if (recalcTimer.current) clearTimeout(recalcTimer.current);
    };
  }, [pricingKey]);

  const isCalculating = recalculating || estimateQuery.isLoading;

  if (!serviceType || !selectedDate || !selectedTimeSlot) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('booking.detailsTitle')}
        rightElement={
          <View style={styles.headerServiceIcon}>
            <MaterialCommunityIcons
              name={serviceType === 'menage' ? 'broom' : serviceType === 'cuisine' ? 'chef-hat' : 'baby-bottle'}
              size={18}
              color={colors.navy}
            />
          </View>
        }
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <NeighborhoodPicker
          value={selectedNeighborhoodId}
          label={t('booking.selectNeighborhood')}
          placeholder={t('booking.selectNeighborhood')}
          compact
          actionLabel={selectedNeighborhoodId ? t('booking.changeNeighborhood') : undefined}
          onChange={(value) => {
            setSelectedNeighborhoodId(value);
            setBookingNeighborhoodId(value);
          }}
        />

        {serviceType === 'menage' ? (
          <Card style={styles.block}>
            {/* ── Clean type FIRST with descriptions ── */}
            <Text style={styles.sectionLabel}>{t('booking.cleanType')}</Text>
            <View style={styles.rowTwo}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionCardButton,
                  cleanType === 'simple' && styles.optionCardButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  setCleanType('simple');
                  updateRecommendation(surfaceValue, propertyType, 'simple', floors);
                }}
              >
                <Text style={[styles.optionCardTitle, cleanType === 'simple' && styles.optionCardTitleActive]}>
                  {t('booking.simple')}
                </Text>
                <Text style={[styles.optionCardDesc, cleanType === 'simple' && styles.optionCardDescActive]}>
                  {t('booking.simpleDesc')}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.optionCardButton,
                  cleanType === 'deep' && styles.optionCardButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  setCleanType('deep');
                  updateRecommendation(surfaceValue, propertyType, 'deep', floors);
                }}
              >
                <Text style={[styles.optionCardTitle, cleanType === 'deep' && styles.optionCardTitleActive]}>
                  {t('booking.deep')}
                </Text>
                <Text style={[styles.optionCardDesc, cleanType === 'deep' && styles.optionCardDescActive]}>
                  {t('booking.deepDesc')}
                </Text>
              </Pressable>
            </View>

            {/* ── Property type ── */}
            <Text style={styles.sectionLabel}>{t('booking.propertyType')}</Text>
            <View style={styles.selectorGroup}>
              <View style={styles.rowTwo}>
                <OptionButton
                  label={t('booking.apartment')}
                  active={propertyType === 'apartment'}
                  onPress={() => {
                    setPropertyType('apartment');
                    updateRecommendation(surfaceValue, 'apartment', cleanType, floors);
                  }}
                />
                <OptionButton
                  label={t('booking.villa')}
                  active={propertyType === 'villa'}
                  onPress={() => {
                    setPropertyType('villa');
                    updateRecommendation(surfaceValue, 'villa', cleanType, floors);
                  }}
                />
              </View>
              <View style={styles.rowTwo}>
                <OptionButton
                  label={t('booking.riad')}
                  active={propertyType === 'riad'}
                  onPress={() => {
                    setPropertyType('riad');
                    updateRecommendation(surfaceValue, 'riad', cleanType, floors);
                  }}
                />
                <OptionButton
                  label={t('booking.office')}
                  active={propertyType === 'office'}
                  onPress={() => {
                    setPropertyType('office');
                    updateRecommendation(surfaceValue, 'office', cleanType, floors);
                  }}
                />
              </View>
            </View>

            {/* ── Surface ── */}
            <Text style={styles.sectionLabel}>{t('booking.surface')}</Text>
            <Text style={styles.surfaceValue}>{surfaceValue} m²</Text>
            <Slider
              style={styles.slider}
              minimumValue={SURFACE_MIN}
              maximumValue={SURFACE_MAX}
              step={5}
              value={surfaceSliderValue}
              onValueChange={(value) => {
                const nextValue = Math.round(value);
                setSurface(String(nextValue));
                if (nextValue < SURFACE_MAX) {
                  setCustomSurface('');
                }
                updateRecommendation(nextValue, propertyType, cleanType, floors);
              }}
              minimumTrackTintColor={colors.clay}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.clay}
            />

            {surfaceSliderValue === SURFACE_MAX ? (
              <>
                <Text style={styles.sectionLabel}>{t('booking.exactSurface')}</Text>
                <Input
                  value={customSurface}
                  onChangeText={(value) => {
                    const nextValue = value.replace(/[^0-9]/g, '');
                    setCustomSurface(nextValue);
                    if (!nextValue) {
                      updateRecommendation(SURFACE_MAX, propertyType, cleanType, floors);
                      return;
                    }
                    const parsed = Number(nextValue);
                    const nextSurface = Number.isNaN(parsed)
                      ? SURFACE_MAX
                      : Math.min(SURFACE_ABSOLUTE_MAX, Math.max(SURFACE_MAX, parsed));
                    updateRecommendation(nextSurface, propertyType, cleanType, floors);
                  }}
                  placeholder={t('booking.exactSurfacePlaceholder')}
                  inputMode="numeric"
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.surfaceInput}
                />
                {showSurfaceContactUs ? (
                  <Text style={styles.surfaceContactText}>{t('booking.surfaceContactUs')}</Text>
                ) : null}
              </>
            ) : null}

            {surfaceValue > 100 ? (
              <>
                <Text style={styles.sectionLabel}>{t('booking.floors')}</Text>
                <View style={styles.rowThree}>
                  {(['1', '2', '3+'] as const).map((value) => (
                    <OptionButton
                      key={value}
                      label={value}
                      active={floors === value}
                      onPress={() => {
                        setFloors(value);
                        updateRecommendation(surfaceValue, propertyType, cleanType, value);
                      }}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.sectionLabel}>{t('booking.team')}</Text>
            <View style={styles.rowThree}>
              <OptionButton label={t('booking.solo')} active={teamType === 'solo'} onPress={() => { setTeamManuallySet(true); updateTeamType('solo'); }} />
              <OptionButton label={t('booking.duo')} active={teamType === 'duo'} onPress={() => { setTeamManuallySet(true); updateTeamType('duo'); }} />
              <OptionButton
                label={t('booking.squad')}
                active={teamType === 'squad'}
                onPress={() => { setTeamManuallySet(true); updateTeamType('squad'); }}
              />
            </View>

            {teamType === 'squad' ? (
              <>
                <Text style={styles.sectionLabel}>{t('booking.squadSize')}</Text>
                <View style={styles.rowThree}>
                  {(['3', '4', '5'] as const).map((value) => (
                    <OptionButton
                      key={value}
                      label={value}
                      active={squadSize === value}
                      onPress={() => setSquadSize(value)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </Card>
        ) : null}

        {serviceType === 'cuisine' ? (
          <Card style={styles.block}>
            <Text style={styles.sectionLabel}>{t('booking.mealType')}</Text>
            <View style={styles.rowThree}>
              <OptionButton
                label={t('booking.daily')}
                active={mealType === 'daily'}
                onPress={() => setMealType('daily')}
              />
              <OptionButton
                label={t('booking.reception')}
                active={mealType === 'reception'}
                onPress={() => setMealType('reception')}
              />
              <OptionButton
                label={t('booking.party')}
                active={mealType === 'party'}
                onPress={() => setMealType('party')}
              />
            </View>

            <Text style={styles.sectionLabel}>{t('booking.guests')}</Text>
            <View style={styles.selectorGroup}>
              <View style={styles.rowThree}>
                {(['4', '6', '8'] as const).map((count) => (
                  <OptionButton
                    key={count}
                    label={count}
                    active={guests === count}
                    onPress={() => setGuests(count)}
                  />
                ))}
              </View>
              <View style={styles.rowTwo}>
                {(['12', '20+'] as const).map((count) => (
                  <OptionButton
                    key={count}
                    label={count}
                    active={guests === count}
                    onPress={() => setGuests(count)}
                  />
                ))}
              </View>
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
                  active={children === String(count)}
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
                  active={hours === String(count)}
                  onPress={() => setHours(String(count))}
                />
              ))}
            </View>
          </Card>
        ) : null}

      </ScrollView>

      {/* ── Bottom bar: price + arrow ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceWrap}>
          <Text style={styles.bottomPriceLabel}>
            {!hasMinSelection
              ? t('booking.priceEstimate')
              : showPriceRange
                ? t('booking.priceRange')
                : t('booking.priceEstimate')}
          </Text>
          {isCalculating || !hasMinSelection ? (
            <PulsePrice style={styles.bottomPriceValue} />
          ) : showPriceRange ? (
            <Text style={styles.bottomPriceValue}>
              {estimateLowQuery.data?.floorPrice ?? '—'} — {estimateHighQuery.data?.ceilingPrice ?? '—'} MAD
            </Text>
          ) : estimateQuery.data?.recommendedPrice ? (
            <Text style={styles.bottomPriceValue}>{estimateQuery.data.recommendedPrice} MAD</Text>
          ) : (
            <PulsePrice style={styles.bottomPriceValue} />
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.bottomArrowBtn,
            (!estimateQuery.data || !selectedNeighborhoodId || !canProceed) && styles.bottomArrowBtnDisabled,
            pressed && styles.pressed,
          ]}
          disabled={!estimateQuery.data || !selectedNeighborhoodId || !canProceed}
          onPress={() => {
            if (!pricingInput || !estimateQuery.data) return;

            const detail =
              serviceType === 'menage'
                ? {
                    serviceType,
                    selectedDate,
                    selectedTimeSlot,
                    demandLevel,
                    surface: surfaceValue,
                    cleanType: cleanType!,
                    teamType: teamType!,
                    ...(teamType === 'squad' ? { squadSize: Number(squadSize!) } : {}),
                    propertyType: propertyType!,
                    floors: getFloorsCount(surfaceValue > 100 ? (floors ?? '1') : '1'),
                  }
                : serviceType === 'cuisine'
                  ? {
                      serviceType,
                      selectedDate,
                      selectedTimeSlot,
                      demandLevel,
                      mealType: mealType!,
                      guests: getGuestsCount(guests!) || 1,
                    }
                  : {
                      serviceType,
                      selectedDate,
                      selectedTimeSlot,
                      demandLevel,
                      children: Number(children!) || 1,
                      hours: Number(hours!) || 1,
                    };

            setBookingDraft({
              serviceType,
              ...(selectedNeighborhoodId ? { neighborhoodId: selectedNeighborhoodId } : {}),
              schedule: {
                selectedDate,
                selectedTimeSlot,
                demandLevel,
                demandMultiplier: getDemandMultiplier(demandLevel),
              },
              detail,
              estimate: {
                floorPrice: estimateQuery.data.floorPrice,
                recommendedPrice: estimateQuery.data.recommendedPrice,
                ceilingPrice: estimateQuery.data.ceilingPrice,
                ceiling: estimateQuery.data.ceilingPrice,
                durationMinutes: estimateQuery.data.durationMinutes,
              },
            });

            router.push('/(client)/booking/confirm');
          }}
        >
          <Ionicons name="arrow-forward" size={24} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* ── Header ── */
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
  headerServiceIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.whiteA60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },

  /* ── Option card (clean type with description) ── */
  optionCardButton: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  optionCardButtonActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navyTint07,
  },
  optionCardTitle: {
    ...textStyles.h3,
    color: colors.textSec,
  },
  optionCardTitleActive: {
    color: colors.navy,
  },
  optionCardDesc: {
    fontFamily: fonts.dmSans.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  optionCardDescActive: {
    color: colors.textSec,
  },

  /* ── Bottom bar ── */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.clay,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl + spacing.sm : spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
  },
  bottomPriceWrap: {
    flex: 1,
    gap: 2,
  },
  bottomPriceLabel: {
    fontFamily: fonts.dmSans.semiBold,
    fontSize: 11,
    color: colors.whiteA70,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bottomPriceValue: {
    fontFamily: fonts.nunito.bold,
    fontSize: 26,
    color: colors.white,
  },
  bottomArrowBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  bottomArrowBtnDisabled: {
    opacity: 0.35,
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
  selectorGroup: {
    gap: spacing.sm,
  },
  rowThree: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowFour: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  surfaceInput: {
    marginTop: -spacing.xs,
  },
  surfaceContactText: {
    ...textStyles.body,
    color: colors.clay,
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
});
