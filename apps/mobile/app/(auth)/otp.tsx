import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { otpVerifySchema } from '@babloo/shared';
import { useTranslation } from 'react-i18next';
import { BackHeader, Button, Card } from '../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../src/constants/theme';
import { getErrorMessage } from '../../src/lib/errors';
import { useAuth } from '../../src/providers/AuthProvider';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const { t } = useTranslation();
  const { loginWithOtp, requestOtp } = useAuth();
  const params = useLocalSearchParams<{
    challengeId?: string;
    phone?: string;
    purpose?: string;
    fullName?: string;
  }>();
  const inputRef = useRef<TextInput | null>(null);

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : value));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slots = useMemo(() => {
    return new Array(OTP_LENGTH).fill(null).map((_, index) => code[index] ?? '');
  }, [code]);

  const handleVerify = async () => {
    setError(undefined);
    try {
      if (!params.challengeId) {
        setError(t('auth.missingChallengeId'));
        return;
      }

      const parsed = otpVerifySchema.safeParse({
        challengeId: params.challengeId,
        code,
        fullName: params.fullName,
      });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t('auth.invalidCode'));
        return;
      }

      setLoading(true);
      await loginWithOtp(parsed.data);
    } catch (e) {
      const message = getErrorMessage(e, t('auth.unableVerifyOtp'));
      setError(message);
      Alert.alert(t('auth.verificationFailedTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!params.phone || !params.purpose || secondsLeft > 0) {
      return;
    }

    try {
      await requestOtp({
        phone: params.phone,
        purpose: params.purpose as 'login' | 'signup' | 'reset',
      });
      setSecondsLeft(RESEND_SECONDS);
      Alert.alert(t('auth.codeSentTitle'), t('auth.resendCodeSentBody'));
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e, t('auth.unableSendCode')));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('auth.otpTitle')} />

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.otpTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.otpSubtitle', { phone: params.phone ?? '' })}</Text>

        <Card style={styles.card}>
          <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
            {slots.map((digit, index) => (
              <View key={index} style={[styles.slot, digit ? styles.slotFilled : null]}>
                <Text style={styles.slotText}>{digit}</Text>
              </View>
            ))}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(value) => {
              const normalized = value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
              setCode(normalized);
            }}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            style={styles.hiddenInput}
            autoFocus
            textContentType="oneTimeCode"
          />

          {error ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={spacing.md + spacing.xs} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            variant="primary"
            label={t('auth.verify')}
            onPress={handleVerify}
            loading={loading}
            disabled={code.length < OTP_LENGTH}
            style={styles.submitBtn}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendTimer}>
              {secondsLeft > 0 ? t('auth.resendIn', { count: secondsLeft }) : t('auth.canResend')}
            </Text>
            <Pressable onPress={handleResend} disabled={secondsLeft > 0} style={({ pressed }) => [pressed && styles.pressed]}>
              <Text style={[styles.resendLink, secondsLeft > 0 && styles.resendDisabled]}>{t('auth.resendOtp')}</Text>
            </Pressable>
          </View>
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
    fontSize: 32,
    lineHeight: 40,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSec,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.xl,
    gap: spacing.md,
    ...shadows.md,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  slot: {
    flex: 1,
    height: spacing['2xl'] + spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: {
    borderColor: colors.navy,
    backgroundColor: colors.surface,
  },
  slotText: {
    ...textStyles.h2,
    color: colors.navy,
    fontSize: 22,
  },
  hiddenInput: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
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
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resendTimer: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  resendLink: {
    ...textStyles.body,
    color: colors.clay,
    fontFamily: 'DMSans_700Bold',
  },
  resendDisabled: {
    color: colors.textMuted,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
