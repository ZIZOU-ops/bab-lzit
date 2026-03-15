import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../src/constants/theme';

type AuthMode = 'signIn' | 'signUp';
const TAB_WIDTH = (spacing.lg * 10 + spacing.md) / 2;

export default function AuthEntryScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const indicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: mode === 'signIn' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }, [indicator, mode]);

  const methods = useMemo(() => {
    if (mode === 'signIn') {
      return [
        {
          key: 'email',
          label: t('auth.signInWithEmail'),
          icon: <MaterialCommunityIcons name="email-outline" size={spacing.md + spacing.xs} color={colors.navy} />,
          onPress: () => router.push('/(auth)/sign-in-email'),
        },
        {
          key: 'phone',
          label: t('auth.signInWithPhone'),
          icon: <MaterialCommunityIcons name="phone-outline" size={spacing.md + spacing.xs} color={colors.navy} />,
          onPress: () => router.push('/(auth)/sign-in-phone'),
        },
      ];
    }

    return [
      {
        key: 'email',
        label: t('auth.signUpWithEmail'),
        icon: <MaterialCommunityIcons name="account-plus-outline" size={spacing.md + spacing.xs} color={colors.navy} />,
        onPress: () => router.push('/(auth)/sign-up-email'),
      },
      {
        key: 'phone',
        label: t('auth.signUpWithPhone'),
        icon: <MaterialCommunityIcons name="cellphone-key" size={spacing.md + spacing.xs} color={colors.navy} />,
        onPress: () => router.push('/(auth)/sign-up-phone'),
      },
    ];
  }, [mode, t]);

  const translateX = indicator.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={[styles.heroBlob, styles.heroBlobA]} />
        <View style={[styles.heroBlob, styles.heroBlobB]} />
        <View style={[styles.heroBlob, styles.heroBlobC]} />

        <View style={styles.logoWrap}>
          <View style={styles.logoGlass}>
            <Text style={styles.logoLetter}>B</Text>
          </View>
          <Text style={styles.heroTitle}>{t('home.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('auth.moroccoSubtitle')}</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.tabs}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, TAB_WIDTH],
                    }),
                  },
                ],
              },
            ]}
          />

          <Pressable
            style={styles.tabBtn}
            onPress={() => setMode('signIn')}
          >
            <Text style={[styles.tabText, mode === 'signIn' && styles.tabTextActive]}>{t('auth.signInTab')}</Text>
          </Pressable>
          <Pressable
            style={styles.tabBtn}
            onPress={() => setMode('signUp')}
          >
            <Text style={[styles.tabText, mode === 'signUp' && styles.tabTextActive]}>{t('auth.signUpTab')}</Text>
          </Pressable>
        </View>

        <View style={styles.methods}>
          {methods.map((method) => (
            <Pressable
              key={method.key}
              style={({ pressed }) => [styles.methodBtn, pressed && styles.pressed]}
              onPress={method.onPress}
            >
              <View style={styles.methodIcon}>{method.icon}</View>
              <Text style={styles.methodLabel}>{method.label}</Text>
              <Ionicons name="chevron-forward" size={spacing.lg} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.ssoRow}>
          <Button
            variant="outline"
            label={t('auth.continueGoogle')}
            onPress={() => undefined}
            icon={<Ionicons name="logo-google" size={spacing.md + spacing.xs} color={colors.navy} />}
            style={styles.ssoBtn}
          />
          <Button
            variant="primary"
            label={t('auth.continueApple')}
            onPress={() => undefined}
            icon={<Ionicons name="logo-apple" size={spacing.md + spacing.xs} color={colors.white} />}
            style={styles.ssoBtn}
          />
        </View>

        <Text style={styles.legal}>
          {t('auth.legal')}
        </Text>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    height: '42%',
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: radius.full,
  },
  heroBlobA: {
    width: spacing['2xl'] * 5,
    height: spacing['2xl'] * 5,
    top: -spacing['2xl'],
    left: -spacing.lg,
    backgroundColor: colors.clayA24,
  },
  heroBlobB: {
    width: spacing['2xl'] * 4,
    height: spacing['2xl'] * 4,
    right: -spacing.xl,
    top: spacing.lg,
    backgroundColor: colors.whiteA12,
  },
  heroBlobC: {
    width: spacing['2xl'] * 3,
    height: spacing['2xl'] * 3,
    bottom: -spacing.lg,
    left: spacing['2xl'],
    backgroundColor: colors.clayA18,
  },
  logoWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoGlass: {
    width: spacing['2xl'] * 2,
    height: spacing['2xl'] * 2,
    borderRadius: radius.full,
    backgroundColor: colors.whiteA12,
    borderWidth: 1.5,
    borderColor: colors.whiteA60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: colors.white,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 38,
  },
  heroTitle: {
    ...textStyles.display,
    color: colors.white,
    fontSize: 44,
    lineHeight: 52,
  },
  heroSubtitle: {
    ...textStyles.body,
    color: colors.whiteA70,
    fontSize: 14,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: -(spacing['2xl'] + spacing.sm),
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  tabs: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.full,
    flexDirection: 'row',
    padding: spacing.xs,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: TAB_WIDTH,
    bottom: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + spacing.xs,
  },
  tabText: {
    ...textStyles.h3,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.navy,
  },
  methods: {
    gap: spacing.sm,
  },
  methodBtn: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  methodIcon: {
    width: spacing['2xl'],
    height: spacing['2xl'],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.clayTint,
  },
  methodLabel: {
    ...textStyles.body,
    color: colors.navy,
    flex: 1,
    fontFamily: 'DMSans_600SemiBold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  ssoRow: {
    gap: spacing.sm,
  },
  ssoBtn: {
    width: '100%',
  },
  legal: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
