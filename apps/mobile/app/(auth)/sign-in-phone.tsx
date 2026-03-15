import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { otpRequestSchema } from '@babloo/shared';
import { useTranslation } from 'react-i18next';
import { BackHeader, Button, Card, Input } from '../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../src/constants/theme';
import { getErrorMessage } from '../../src/lib/errors';
import { useAuth } from '../../src/providers/AuthProvider';

export default function SignInPhoneScreen() {
  const { t } = useTranslation();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    setError(undefined);
    try {
      const parsed = otpRequestSchema.safeParse({ phone, purpose: 'login' });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t('auth.invalidPhoneNumber'));
        return;
      }

      setLoading(true);
      const result = await requestOtp(parsed.data);
      router.push({
        pathname: '/(auth)/otp',
        params: {
          challengeId: result.challengeId,
          phone,
          purpose: 'login',
        },
      });
    } catch (e) {
      const message = getErrorMessage(e, t('auth.unableSendOtp'));
      setError(message);
      Alert.alert(t('auth.otpErrorTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('auth.signInWithPhone')} />

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.phoneLoginTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.phoneLoginSubtitle')}</Text>

        <Card style={styles.formCard}>
          <Input
            label={t('auth.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            rightElement={
              <MaterialCommunityIcons
                name="phone-outline"
                size={spacing.md + spacing.xs}
                color={colors.textMuted}
              />
            }
          />

          {error ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={spacing.md + spacing.xs} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            variant="primary"
            label={t('auth.sendCode')}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...textStyles.display,
    color: colors.navy,
    fontSize: 34,
    lineHeight: 42,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSec,
    marginBottom: spacing.sm,
  },
  formCard: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  errorBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.dangerBg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    ...textStyles.body,
    color: colors.error,
    flex: 1,
  },
  submitBtn: {
    ...shadows.md,
  },
});
