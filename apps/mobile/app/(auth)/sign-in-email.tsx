import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loginSchema } from '@babloo/shared';
import { useTranslation } from 'react-i18next';
import { BackHeader, Button, Card, Input } from '../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../src/constants/theme';
import { getErrorMessage } from '../../src/lib/errors';
import { useAuth } from '../../src/providers/AuthProvider';

export default function SignInEmailScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    setError(undefined);
    try {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
        return;
      }

      setLoading(true);
      await login(parsed.data);
    } catch (e) {
      const message = getErrorMessage(e, t('auth.unableSignIn'));
      setError(message);
      Alert.alert(t('auth.signInFailedTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('auth.signInWithEmail')} />

      <View style={styles.content}>
        <Text style={styles.title}>
          {t('auth.welcomeBack')}
          <Text style={styles.titleDot}>.</Text>
        </Text>
        <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>

        <Card style={styles.formCard}>
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
            placeholder={t('auth.passwordPlaceholder')}
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

          <Pressable
            style={({ pressed }) => [styles.forgotWrap, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
          </Pressable>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={spacing.md + spacing.xs} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            variant="primary"
            label={t('auth.signIn')}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </Card>

        <Pressable
          style={({ pressed }) => [styles.footer, pressed && styles.pressed]}
          onPress={() => router.push('/(auth)/sign-up-email')}
        >
          <Text style={styles.footerText}>
            {t('auth.noAccount')}{' '}
            <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
          </Text>
        </Pressable>
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
    fontSize: 42,
    lineHeight: 48,
    marginTop: spacing.sm,
  },
  titleDot: {
    color: colors.clay,
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
  eyeBtn: {
    width: spacing.lg,
    height: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotWrap: {
    alignSelf: 'flex-end',
  },
  forgot: {
    ...textStyles.body,
    color: colors.clay,
    fontFamily: 'DMSans_600SemiBold',
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
    marginTop: spacing.sm,
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
