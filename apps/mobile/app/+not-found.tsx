import React from 'react';
import { Link } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, textStyles } from '../src/constants/theme';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('notFound.title')}</Text>
        <Text style={styles.subtitle}>{t('notFound.subtitle')}</Text>
        <Link href="/(auth)" style={styles.link}>
          {t('notFound.goHome')}
        </Link>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSec,
    textAlign: 'center',
  },
  link: {
    color: colors.clay,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});
