import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BackHeader } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';

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
  {
    key: 'cuisine',
    titleKey: 'booking.cuisine',
    descriptionKey: 'booking.cuisineDesc',
    icon: 'chef-hat',
  },
  {
    key: 'childcare',
    titleKey: 'booking.childcare',
    descriptionKey: 'booking.childcareDesc',
    icon: 'baby-face-outline',
  },
];

export default function BookingServiceScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('booking.selectService')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('booking.selectService')}</Text>

        {services.map((service) => (
          <Pressable
            key={service.key}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() =>
              router.push({
                pathname: '/(client)/booking/details',
                params: { serviceType: service.key },
              })
            }
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
