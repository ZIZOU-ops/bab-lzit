import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NeighborhoodPicker, ScreenHeader } from '../../../src/components/ui';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import {
  getBookingNeighborhoodId,
  setBookingNeighborhoodId,
} from '../../../src/state/bookingDraft';

type ServiceItem = {
  key: 'menage' | 'cuisine' | 'childcare';
  titleKey: 'booking.menage' | 'booking.cuisine' | 'booking.childcare';
  descriptionKey: 'booking.menageDesc' | 'booking.cuisineDesc' | 'booking.childcareDesc';
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const services: ServiceItem[] = [
  {
    key: 'menage',
    titleKey: 'booking.menage',
    descriptionKey: 'booking.menageDesc',
    icon: 'broom',
  },
  // TODO: réactiver quand les services seront prêts
  // {
  //   key: 'cuisine',
  //   titleKey: 'booking.cuisine',
  //   descriptionKey: 'booking.cuisineDesc',
  //   icon: 'chef-hat',
  // },
  // TODO: réactiver quand les services seront prêts
  // {
  //   key: 'childcare',
  //   titleKey: 'booking.childcare',
  //   descriptionKey: 'booking.childcareDesc',
  //   icon: 'baby-face-outline',
  // },
];

export default function BookingServiceScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    neighborhoodId?: string;
    selectedDate?: string;
    selectedTimeSlot?: string;
    demandLevel?: string;
  }>();
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | null>(() =>
    typeof params.neighborhoodId === 'string' ? params.neighborhoodId : getBookingNeighborhoodId(),
  );
  const [isNeighborhoodPickerOpen, setIsNeighborhoodPickerOpen] = useState(false);
  const [pendingServiceKey, setPendingServiceKey] = useState<ServiceItem['key'] | null>(null);
  const selectedDate = typeof params.selectedDate === 'string' ? params.selectedDate : undefined;
  const selectedTimeSlot =
    typeof params.selectedTimeSlot === 'string' ? params.selectedTimeSlot : undefined;
  const demandLevel = typeof params.demandLevel === 'string' ? params.demandLevel : undefined;

  const openNextStep = (serviceType: ServiceItem['key'], neighborhoodId: string) => {
    if (selectedDate && selectedTimeSlot) {
      router.replace({
        pathname: '/(client)/booking/details',
        params: {
          serviceType,
          neighborhoodId,
          selectedDate,
          selectedTimeSlot,
          ...(demandLevel ? { demandLevel } : {}),
        },
      });
      return;
    }

    router.replace({
      pathname: '/(client)/booking/schedule',
      params: {
        serviceType,
        neighborhoodId,
      },
    });
  };

  useEffect(() => {
    if (!selectedNeighborhoodId) return;
    openNextStep('menage', selectedNeighborhoodId);
  }, [selectedDate, selectedNeighborhoodId, selectedTimeSlot, demandLevel]);

  const handleServicePress = (serviceType: ServiceItem['key']) => {
    if (!selectedNeighborhoodId) {
      setPendingServiceKey(serviceType);
      setIsNeighborhoodPickerOpen(true);
      return;
    }

    openNextStep(serviceType, selectedNeighborhoodId);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('booking.selectService')} />
      <ScrollView contentContainerStyle={styles.content}>
        <NeighborhoodPicker
          value={selectedNeighborhoodId}
          label={t('booking.selectNeighborhood')}
          placeholder={t('booking.selectNeighborhood')}
          open={isNeighborhoodPickerOpen}
          onOpenChange={(open) => {
            setIsNeighborhoodPickerOpen(open);
            if (!open) {
              setPendingServiceKey(null);
            }
          }}
          onChange={(value) => {
            setSelectedNeighborhoodId(value);
            setBookingNeighborhoodId(value);
            setIsNeighborhoodPickerOpen(false);
            setPendingServiceKey(null);
          }}
        />
        <Text style={styles.title}>{t('booking.selectService')}</Text>

        {services.map((service) => (
          <Pressable
            key={service.key}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => handleServicePress(service.key)}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={service.icon} size={spacing.lg + spacing.sm} color={colors.navy} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{t(service.titleKey)}</Text>
              <Text style={styles.cardSubtitle}>{t(service.descriptionKey)}</Text>
            </View>
            <View style={styles.selectPill}>
              <Text style={styles.selectText}>{t('booking.select')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={spacing.md + spacing.xs} color={colors.clay} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  title: {
    ...textStyles.h1,
    color: colors.navy,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: spacing.xs / spacing.xs,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: spacing['2xl'] + spacing.md,
    height: spacing['2xl'] + spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    gap: spacing.xs,
  },
  cardTitle: {
    ...textStyles.h2,
    color: colors.navy,
  },
  cardSubtitle: {
    ...textStyles.body,
    color: colors.textSec,
  },
  selectPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectText: {
    ...textStyles.h3,
    color: colors.clay,
  },
});
