import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { trpc } from '../../../src/lib/trpc';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useI18n } from '../../../src/providers/I18nProvider';
import { Avatar, Button, Card, Input, LoadingScreen } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { getErrorMessage } from '../../../src/lib/errors';

export default function ProfileTabScreen() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { locale, setLocale } = useI18n();
  const meQuery = trpc.user.me.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation({
    async onSuccess() {
      await meQuery.refetch();
    },
  });

  const [name, setName] = useState('');

  useEffect(() => {
    if (meQuery.data?.fullName) {
      setName(meQuery.data.fullName);
    }
  }, [meQuery.data?.fullName]);

  if (meQuery.isLoading) {
    return <LoadingScreen />;
  }

  const user = meQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <Avatar name={user?.fullName ?? t('home.title')} size="lg" />
          <View style={styles.profileTextWrap}>
            <Text style={styles.title}>{user?.fullName ?? t('profile.title')}</Text>
            <Text style={styles.subtitle}>{t('profile.title')}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Input
            label={t('profile.fullName')}
            value={name}
            onChangeText={setName}
            rightElement={<Ionicons name="person-outline" size={spacing.md + spacing.xs} color={colors.clay} />}
          />

          <View style={styles.metaRow}>
            <Ionicons name="mail-outline" size={spacing.md + spacing.xs} color={colors.clay} />
            <Text style={styles.metaText}>{user?.email ?? t('common.notAvailable')}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={spacing.md + spacing.xs} color={colors.clay} />
            <Text style={styles.metaText}>{user?.phone ?? t('common.notAvailable')}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.languageLabel}>{t('profile.language')}</Text>
          <View style={styles.row}>
            <Button
              variant={locale === 'fr' ? 'primary' : 'outline'}
              label="FR"
              onPress={() => void setLocale('fr')}
              style={styles.localeButton}
            />
            <Button
              variant={locale === 'en' ? 'primary' : 'outline'}
              label="EN"
              onPress={() => void setLocale('en')}
              style={styles.localeButton}
            />
            <Button
              variant={locale === 'ar' ? 'primary' : 'outline'}
              label="AR"
              onPress={() => void setLocale('ar')}
              style={styles.localeButton}
            />
          </View>
        </Card>

        <Button
          variant="primary"
          label={t('profile.save')}
          loading={updateProfile.isPending}
          onPress={() => {
            updateProfile.mutate(
              {
                name,
                locale,
              },
              {
                onError(error) {
                  Alert.alert(t('common.error'), getErrorMessage(error, t('profile.updateFailed')));
                },
              },
            );
          }}
        />

        <Button variant="clay" label={t('profile.logout')} onPress={() => void logout()} />
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
    paddingTop: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  profileCard: {
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  profileTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSec,
  },
  card: {
    borderRadius: radius.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  localeButton: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...textStyles.body,
    color: colors.textSec,
  },
  languageLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
});
