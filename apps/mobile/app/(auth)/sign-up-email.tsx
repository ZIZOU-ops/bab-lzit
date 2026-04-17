import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signupSchema } from '@babloo/shared';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../../src/components/ui';
import { AuthFormHeader } from '../../src/components/AuthFormHeader';
import { colors, radius, shadows, spacing, textStyles } from '../../src/constants/theme';
import { useClampedKeyboardLift } from '../../src/hooks/useClampedKeyboardLift';
import { getErrorMessage } from '../../src/lib/errors';
import { useAuth } from '../../src/providers/AuthProvider';

export default function SignUpEmailScreen() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const parsed = signupSchema.safeParse({ fullName, email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
        return;
      }

      setLoading(true);
      await signup(parsed.data);
    } catch (e) {
      const message = getErrorMessage(e, t('auth.unableCreateAccount'));
      setError(message);
      Alert.alert(t('auth.signUpFailedTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuthFormHeader
        title={t('auth.createAccount')}
        subtitle={t('auth.signUpSubtitle')}
        typeSpeed={85}
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
            />
            <Input
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              inputMode="email"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordHint')}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              rightElement={
                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  style={({ pressed }) => [styles.eyeBtn, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={spacing.md + spacing.xs}
                    color={colors.textMuted}
                  />
                </Pressable>
              }
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={spacing.md + spacing.xs} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              variant="primary"
              label={t('auth.signUp')}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />

            <Pressable
              style={({ pressed }) => [styles.footer, pressed && styles.pressed]}
              onPress={() => router.push('/(auth)/sign-in-email')}
            >
              <Text style={styles.footerText}>
                {t('auth.hasAccount')}{' '}
                <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
              </Text>
            </Pressable>
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
  eyeBtn: {
    width: spacing.lg,
    height: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  footerText: {
    ...textStyles.body,
    color: colors.textSec,
  },
  footerLink: {
    color: colors.clay,
    fontFamily: 'DMSans_700Bold',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
