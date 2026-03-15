import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BackHeader, Button, Card } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';

export default function BookingConfirmedScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('booking.orderConfirmed')} onBack={() => router.replace('/(client)/(tabs)')} />

      <View style={styles.content}>
        <Card style={styles.card}>
          <Animated.View style={[styles.successCircle, { transform: [{ scale: pulse }] }]}>
            <Ionicons name="checkmark" size={spacing['2xl']} color={colors.white} />
          </Animated.View>

          <Text style={styles.title}>{t('booking.orderConfirmed')}</Text>
          <Text style={styles.body}>{t('booking.bookingActive')}</Text>

          <Button
            variant="primary"
            label={t('booking.trackOrder')}
            icon={<Ionicons name="navigate-outline" size={spacing.md + spacing.xs} color={colors.white} />}
            onPress={() =>
              router.replace({
                pathname: '/(client)/order/tracking',
                params: { orderId: params.orderId },
              })
            }
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    paddingBottom: spacing['2xl'],
  },
  card: {
    borderRadius: radius.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  successCircle: {
    width: spacing['2xl'] * 2,
    height: spacing['2xl'] * 2,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
    textAlign: 'center',
  },
  body: {
    ...textStyles.body,
    color: colors.textSec,
    textAlign: 'center',
  },
});
