import React, { useState } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { otpRequestSchema } from '@babloo/shared';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, ScreenHeader } from '../../src/components/ui';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../src/constants/theme';
import { useClampedKeyboardLift } from '../../src/hooks/useClampedKeyboardLift';
import { getErrorMessage } from '../../src/lib/errors';
import { useAuth } from '../../src/providers/AuthProvider';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { translateY, onCardLayout, onContainerLayout, setProtectedBottom } = useClampedKeyboardLift();

  const handleSubmit = async () => {
    setError(undefined);
    try {
      const parsed = otpRequestSchema.safeParse({ phone, purpose: 'reset' });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t('auth.invalidPhoneNumber'));
        return;
      }

      setLoading(true);
      await requestOtp(parsed.data);
      Alert.alert(t('auth.codeSentTitle'), t('auth.codeSentBody'));
    } catch (e) {
      const message = getErrorMessage(e, t('auth.unableSendCode'));
      setError(message);
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('auth.resetPassword')}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setProtectedBottom(y + height);
        }}
      />

      <View style={styles.content} onLayout={onContainerLayout}>
        <Animated.View onLayout={onCardLayout} style={{ transform: [{ translateY }] }}>
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
              label={t('auth.sendResetCode')}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />
          </Card>
        </Animated.View>
      </View>
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
    flex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
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
