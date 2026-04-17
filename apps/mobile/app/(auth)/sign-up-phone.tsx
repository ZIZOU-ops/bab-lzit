import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { otpRequestSchema } from '@babloo/shared';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../../src/components/ui';
import { AuthFormHeader } from '../../src/components/AuthFormHeader';
import { colors, radius, shadows, spacing, textStyles } from '../../src/constants/theme';
import { useClampedKeyboardLift } from '../../src/hooks/useClampedKeyboardLift';
import { getErrorMessage } from '../../src/lib/errors';
import { useAuth } from '../../src/providers/AuthProvider';

export default function SignUpPhoneScreen() {
  const { t } = useTranslation();
  const { requestOtp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const { translateY, onCardLayout, onContainerLayout, setProtectedBottom } = useClampedKeyboardLift();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        delay: 400,
        useNativeDriver: true,
        damping: 16,
        stiffness: 80,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  const handleSubmit = async () => {
    setError(undefined);
    try {
      if (!fullName.trim()) {
        setError(t('auth.fullNameRequired'));
        return;
      }

      const parsed = otpRequestSchema.safeParse({ phone, purpose: 'signup' });
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
          purpose: 'signup',
          fullName,
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
    <View style={styles.container}>
      <AuthFormHeader
        title={t('auth.phoneSignupTitle')}
        subtitle={t('auth.phoneSignupSubtitle')}
        typeSpeed={80}
        onHeaderLayout={setProtectedBottom}
      />

      <View style={styles.content} onLayout={onContainerLayout}>
        <Animated.View
          onLayout={onCardLayout}
          style={[
            styles.cardOuter,
            {
              opacity: cardOpacity,
              transform: [
                { translateY: cardTranslateY },
                { translateY },
              ],
            },
          ]}
        >
          <View style={styles.card}>
            <Input
              label={t('auth.fullName')}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('auth.fullNamePlaceholder')}
              autoCapitalize="words"
              rightElement={
                <MaterialCommunityIcons
                  name="account-outline"
                  size={spacing.md + spacing.xs}
                  color={colors.textMuted}
                />
              }
            />
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
              label={t('booking.continue')}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  cardOuter: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: spacing.lg,
    gap: spacing.sm,
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
