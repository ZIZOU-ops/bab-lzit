import React, { useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useOrders } from '../../../src/hooks/orders/useOrderQueries';
import { getPageItems } from '../../../src/lib/pagination';

type ServiceKey = 'menage' | 'cuisine' | 'childcare';
type ComingSoonKey = 'plomberie' | 'electricite' | 'it';

const ACTIVE_SERVICES: Array<{
  key: ServiceKey;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}> = [
  { key: 'menage', icon: 'broom' },
  { key: 'cuisine', icon: 'chef-hat' },
  { key: 'childcare', icon: 'baby-face-outline' },
];

const COMING_SOON: Array<{ key: ComingSoonKey; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }> = [
  { key: 'plomberie', icon: 'wrench-outline' },
  { key: 'electricite', icon: 'flash-outline' },
  { key: 'it', icon: 'laptop' },
];

const ZONES = [
  { zone: 'Agdal', city: 'Rabat' },
  { zone: 'Hay Riad', city: 'Rabat' },
  { zone: 'Hassan', city: 'Rabat' },
  { zone: 'Sale Medina', city: 'Sale' },
  { zone: 'Tabriquet', city: 'Sale' },
] as const;

const activeStatuses = new Set(['negotiating', 'accepted', 'en_route', 'in_progress']);

export default function ClientHomeScreen() {
  const { t } = useTranslation();
  const ordersQuery = useOrders(10);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<(typeof ZONES)[number]>(ZONES[0]);

  const activeOrder = useMemo(() => {
    const pages = ordersQuery.data?.pages ?? [];
    for (const page of pages) {
      const items = getPageItems(page);
      const candidate = items.find((item) => {
        if (!item || typeof item !== 'object' || !('status' in item)) {
          return false;
        }

        return activeStatuses.has(String(item.status));
      });

      if (candidate) {
        return candidate as { id: string };
      }
    }

    return null;
  }, [ordersQuery.data?.pages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSurface}>
        <Pressable
          style={({ pressed }) => [styles.locationPill, pressed && styles.pressed]}
          onPress={() => setLocationOpen(true)}
        >
          <MaterialCommunityIcons name="map-marker" size={spacing.lg} color={colors.clay} />
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationLabel}>{t('home.serviceAddressLabel')}</Text>
            <Text style={styles.locationValue}>{`${selectedZone.zone}, ${selectedZone.city}`}</Text>
          </View>
          <Ionicons name="chevron-down" size={spacing.lg} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.brand}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

        {activeOrder ? (
          <Pressable
            style={({ pressed }) => [styles.trackBanner, pressed && styles.pressed]}
            onPress={() =>
              router.push({
                pathname: '/(client)/order/tracking',
                params: { orderId: activeOrder.id },
              })
            }
          >
            <View style={styles.trackIconWrap}>
              <Ionicons name="navigate" size={spacing.md + spacing.xs} color={colors.clayLight} />
            </View>
            <View style={styles.trackTextWrap}>
              <Text style={styles.trackLabel}>{t('home.trackPro')}</Text>
              <Text style={styles.trackTitle}>{t('home.orderInProgress')}</Text>
              <Text style={styles.trackBody}>{t('home.realTimeTracking')}</Text>
            </View>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.promoCard, pressed && styles.promoPressed]}
          onPress={() =>
            router.push({
              pathname: '/(client)/booking/details',
              params: { serviceType: 'menage' },
            })
          }
        >
          <View style={styles.promoRingLarge} />
          <View style={styles.promoRingSmall} />
          <Text style={styles.promoLabel}>{t('home.welcomeOffer')}</Text>
          <Text style={styles.promoTitle}>{t('home.welcomeOfferTitle')}</Text>
          <Text style={styles.promoSub}>{t('home.welcomeOfferBody')}</Text>
          <View style={styles.promoCta}>
            <MaterialCommunityIcons name="calendar-check-outline" size={spacing.md} color={colors.white} />
            <Text style={styles.promoCtaText}>{t('home.bookNow')}</Text>
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>{t('booking.selectService')}</Text>

        <View style={styles.grid}>
          {ACTIVE_SERVICES.map((service) => (
            <Pressable
              key={service.key}
              style={({ pressed }) => [styles.serviceCard, pressed && styles.serviceCardPressed]}
              onPress={() =>
                router.push({
                  pathname: '/(client)/booking/details',
                  params: { serviceType: service.key },
                })
              }
            >
              <View style={styles.serviceDot} />
              <View style={styles.serviceIconBox}>
                <MaterialCommunityIcons name={service.icon} size={spacing.lg + spacing.xs} color={colors.navy} />
              </View>
              <Text style={styles.serviceTitle}>{t(`booking.${service.key}`)}</Text>
              <Text style={styles.serviceSub}>{t(`home.serviceSub.${service.key}`)}</Text>
            </Pressable>
          ))}

          {COMING_SOON.map((service) => (
            <View key={service.key} style={[styles.serviceCard, styles.serviceCardDisabled]}>
              <View style={[styles.serviceIconBox, styles.serviceIconBoxDisabled]}>
                <MaterialCommunityIcons name={service.icon} size={spacing.lg + spacing.xs} color={colors.textMuted} />
              </View>
              <Text style={styles.serviceTitleDisabled}>{t(`home.comingSoon.${service.key}`)}</Text>
              <Text style={styles.serviceSub}>{t('home.soon')}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={locationOpen}
        onRequestClose={() => setLocationOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLocationOpen(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('home.serviceAddressTitle')}</Text>
            <Text style={styles.modalSub}>{t('home.serviceAddressSubtitle')}</Text>
            {ZONES.map((item) => (
              <Pressable
                key={item.zone}
                style={({ pressed }) => [
                  styles.modalRow,
                  item.zone === selectedZone.zone && styles.modalRowActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  setSelectedZone(item);
                  setLocationOpen(false);
                }}
              >
                <MaterialCommunityIcons name="map-marker-radius-outline" size={spacing.md + spacing.xs} color={colors.clay} />
                <Text style={styles.modalRowText}>{`${item.zone}, ${item.city}`}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerSurface: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  locationPill: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    fontSize: 9,
  },
  locationValue: {
    color: colors.navy,
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: spacing.xs / 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  brand: {
    ...textStyles.display,
    color: colors.navy,
    fontSize: 56,
    lineHeight: 62,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSec,
    marginBottom: spacing.lg,
  },
  trackBanner: {
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  trackIconWrap: {
    width: spacing['2xl'],
    height: spacing['2xl'],
    borderRadius: radius.full,
    backgroundColor: colors.whiteA07,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTextWrap: {
    flex: 1,
  },
  trackLabel: {
    color: colors.clayLight,
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  trackTitle: {
    color: colors.white,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
  },
  trackBody: {
    color: colors.whiteA70,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  promoCard: {
    borderRadius: radius.xl,
    padding: spacing.lg + spacing.xs,
    overflow: 'hidden',
    marginBottom: spacing.lg + spacing.xs,
    backgroundColor: colors.navy,
    ...shadows.md,
  },
  promoPressed: {
    transform: [{ scale: 0.98 }],
  },
  promoRingLarge: {
    position: 'absolute',
    top: -spacing.lg - spacing.xs,
    right: -spacing.lg - spacing.xs,
    width: spacing['2xl'] * 4,
    height: spacing['2xl'] * 4,
    borderRadius: radius.full,
    borderWidth: spacing.md + spacing.xs,
    borderColor: colors.whiteA05,
  },
  promoRingSmall: {
    position: 'absolute',
    left: spacing.lg,
    bottom: -spacing.lg,
    width: spacing['2xl'] * 2 + spacing.xs,
    height: spacing['2xl'] * 2 + spacing.xs,
    borderRadius: radius.full,
    borderWidth: spacing.md,
    borderColor: colors.clayA18,
  },
  promoLabel: {
    color: colors.clayLight,
    fontSize: 9,
    letterSpacing: 1.5,
    fontFamily: 'DMSans_700Bold',
    marginBottom: spacing.xs + spacing.xs / 2,
  },
  promoTitle: {
    color: colors.white,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    lineHeight: 26,
    marginBottom: spacing.xs + spacing.xs / 2,
  },
  promoSub: {
    color: colors.whiteA55,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    marginBottom: spacing.md,
  },
  promoCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.clay,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + spacing.xs / 2,
    paddingHorizontal: spacing.md + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  promoCtaText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  sectionTitle: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: spacing.sm + spacing.xs / 2,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + spacing.xs / 2,
  },
  serviceCard: {
    width: '31.4%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm + spacing.xs / 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.navyTint06,
    position: 'relative',
    ...shadows.sm,
  },
  serviceCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  serviceDot: {
    position: 'absolute',
    top: spacing.sm + spacing.xs / 2,
    right: spacing.sm + spacing.xs / 2,
    width: spacing.sm - spacing.xs / 2,
    height: spacing.sm - spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  serviceIconBox: {
    width: spacing['2xl'] + spacing.md + spacing.xs / 2,
    height: spacing['2xl'] + spacing.md + spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + spacing.xs / 2,
  },
  serviceIconBoxDisabled: {
    backgroundColor: colors.bg,
  },
  serviceTitle: {
    color: colors.navy,
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    textAlign: 'center',
  },
  serviceTitleDisabled: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    textAlign: 'center',
  },
  serviceSub: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: spacing.xs / 2,
  },
  serviceCardDisabled: {
    opacity: 0.38,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.navyOverlay45,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalTitle: {
    ...textStyles.h2,
    color: colors.navy,
  },
  modalSub: {
    ...textStyles.body,
    color: colors.textSec,
    marginBottom: spacing.sm,
  },
  modalRow: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + spacing.xs / 2,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalRowActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navyTint05,
  },
  modalRowText: {
    ...textStyles.body,
    color: colors.navy,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
