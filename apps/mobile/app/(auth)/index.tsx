import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button } from '../../src/components/ui';
import { AnimatedAuthHeader } from '../../src/components/AnimatedAuthHeader';
import { BablooLogo } from '../../src/components/BablooLogo';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../src/constants/theme';

type AuthMode = 'signIn' | 'signUp';

export default function AuthEntryScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [tabWidth, setTabWidth] = useState(0);
  const indicator = useRef(new Animated.Value(0)).current;

  // ── Card entrance animation ──
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 700,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        delay: 500,
        useNativeDriver: true,
        damping: 16,
        stiffness: 80,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

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
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* ── Full-bleed breathing gradient background ── */}
      <AnimatedAuthHeader />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Floating auth card ── */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View
            style={[
              styles.cardOuter,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <View style={styles.card}>
              {/* Logo inside card */}
              <View style={styles.logoRow}>
                <BablooLogo size={70} fillColor={colors.navy} />
              </View>

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
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  flex: {
    flex: 1,
  },
  /* ── Card positioning ── */
  scrollContent: {
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  /* ── Card ── */
  cardOuter: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: spacing.lg,
    gap: spacing.md,
  },

  /* ── Logo ── */
  logoRow: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
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
    backgroundColor: 'transparent',
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
    backgroundColor: colors.borderStrong,
  },
  dividerText: {
    ...textStyles.body,
    color: colors.textSec,
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
    color: colors.textSec,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },

  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
