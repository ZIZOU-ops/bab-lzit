import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../src/providers/AuthProvider';
import { Avatar, Button, Card, LoadingScreen } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useProProfile } from '../../../src/hooks/pro/useProQueries';

export default function ProProfileScreen() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const profileQuery = useProProfile();

  if (profileQuery.isLoading || !profileQuery.data) {
    return <LoadingScreen />;
  }

  const profile = profileQuery.data;
  const displayName = user?.fullName ?? t('pro.profileTitle');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <Avatar name={displayName} size="lg" />
          <View style={styles.profileInfo}>
            <Text style={styles.title}>{displayName}</Text>
            <Text style={styles.subtitle}>{t('pro.profileTitle')}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>{t('pro.skills')}</Text>
          <Text style={styles.value}>{profile.skills.join(', ') || t('common.notAvailable')}</Text>

          <Text style={styles.label}>{t('pro.zones')}</Text>
          <Text style={styles.value}>{profile.zones.join(', ') || t('common.notAvailable')}</Text>

          <Text style={styles.label}>{t('pro.availability')}</Text>
          <View style={styles.availabilityRow}>
            <Ionicons
              name={profile.isAvailable ? 'checkmark-circle' : 'pause-circle'}
              size={spacing.md + spacing.xs}
              color={profile.isAvailable ? colors.success : colors.textMuted}
            />
            <Text style={styles.value}>{profile.isAvailable ? t('pro.available') : t('pro.offline')}</Text>
          </View>
        </Card>

        <Button variant="clay" label={t('profile.logout')} onPress={() => void logout()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md, paddingBottom: spacing['2xl'] },
  profileCard: {
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  title: { ...textStyles.h1, color: colors.navy },
  subtitle: { ...textStyles.body, color: colors.textSec },
  card: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  label: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  value: {
    ...textStyles.body,
    color: colors.navy,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
