import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ReanimatedAnimated, {
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Button, Card } from '../../src/components/ui';
import { AnimatedAuthHeader } from '../../src/components/AnimatedAuthHeader';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../src/constants/theme';

type AuthMode = 'signIn' | 'signUp';

export default function AuthEntryScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [tabWidth, setTabWidth] = useState(0);
  const indicator = useRef(new Animated.Value(0)).current;
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onTabsLayout = useCallback((e: LayoutChangeEvent) => {
    const innerWidth = e.nativeEvent.layout.width - spacing.xs * 2;
    setTabWidth(innerWidth / 2);
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <ReanimatedAnimated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <AnimatedAuthHeader scrollY={scrollY} />
        <ReanimatedAnimated.Text
          entering={FadeIn.delay(500).duration(800)}
          style={styles.slogan}
        >
          {'Babloo g\u00e8re.\nTu n\u2019as rien \u00e0 faire.'}
        </ReanimatedAnimated.Text>

        {/* ── Auth card ── */}
        <Card style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabs} onLayout={onTabsLayout}>
            {tabWidth > 0 && (
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    width: tabWidth,
                    transform: [
                      {
                        translateX: indicator.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, tabWidth],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}

            <Pressable style={styles.tabBtn} onPress={() => setMode('signIn')}>
              <Text style={[styles.tabText, mode === 'signIn' && styles.tabTextActive]}>
                {t('auth.signInTab')}
              </Text>
            </Pressable>
            <Pressable style={styles.tabBtn} onPress={() => setMode('signUp')}>
              <Text style={[styles.tabText, mode === 'signUp' && styles.tabTextActive]}>
                {t('auth.signUpTab')}
              </Text>
            </Pressable>
          </View>

          {/* Methods */}
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SSO */}
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

          {/* Legal */}
          <Text style={styles.legal}>{t('auth.legal')}</Text>
        </Card>
      </ReanimatedAnimated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing['2xl'],
  },

  /* ── Slogan ── */
  slogan: {
    fontFamily: fonts.dmSans.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSec,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  /* ── Card ── */
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },

  /* ── Tabs ── */
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

  /* ── Methods ── */
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
    fontFamily: fonts.dmSans.semiBold,
  },

  /* ── Divider ── */
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

  /* ── SSO ── */
  ssoRow: {
    gap: spacing.sm,
  },
  ssoBtn: {
    width: '100%',
  },

  /* ── Legal ── */
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
