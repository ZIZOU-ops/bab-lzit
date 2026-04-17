import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, ScreenHeader } from '../../../src/components/ui';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useOrder } from '../../../src/hooks/orders/useOrderQueries';

export default function BookingSearchScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = params.orderId ?? '';
  const orderQuery = useOrder(orderId);

  useEffect(() => {
    if (!orderId) {
      router.replace('/(client)/(tabs)');
      return;
    }

    const interval = setInterval(() => {
      void orderQuery.refetch();
    }, 2000);

    return () => clearInterval(interval);
  }, [orderId, orderQuery]);

  const isMatched = useMemo(() => {
    const status = orderQuery.data?.status;
    return status === 'negotiating' || status === 'accepted' || status === 'en_route' || status === 'in_progress';
  }, [orderQuery.data?.status]);

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('booking.searchingTeam')} />

      <View style={styles.content}>
        {!isMatched ? (
          <Card style={styles.searchCard}>
            <View style={styles.searchIconWrap}>
              <ActivityIndicator color={colors.clay} size="large" />
            </View>
            <Text style={styles.title}>{t('booking.searchingTeam')}</Text>
            <Text style={styles.body}>{t('booking.findingPros')}</Text>
          </Card>
        ) : (
          <Card style={styles.resultCard}>
            <View style={styles.resultIconWrap}>
              <Ionicons name="checkmark" size={spacing.lg + spacing.md} color={colors.white} />
            </View>
            <Text style={styles.resultTitle}>{t('booking.professionalFound')}</Text>
            <Text style={styles.body}>{t('booking.negotiationReady')}</Text>

            <Button
              variant="primary"
              label={t('booking.openOrder')}
              icon={<MaterialCommunityIcons name="chat-processing-outline" size={spacing.md + spacing.xs} color={colors.white} />}
              onPress={() => router.replace(`/(client)/order/${orderId}`)}
            />
            <Button
              variant="outline"
              label={t('booking.goToConfirmation')}
              icon={<Ionicons name="checkmark-done-outline" size={spacing.md + spacing.xs} color={colors.navy} />}
              onPress={() =>
                router.replace({
                  pathname: '/(client)/booking/confirmed',
                  params: { orderId },
                })
              }
            />
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
    paddingBottom: spacing['2xl'],
    justifyContent: 'center',
  },
  searchCard: {
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  searchIconWrap: {
    width: spacing['2xl'] * 2,
    height: spacing['2xl'] * 2,
    borderRadius: radius.full,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
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
  resultCard: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  resultIconWrap: {
    width: spacing['2xl'] * 2,
    height: spacing['2xl'] * 2,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  resultTitle: {
    ...textStyles.h1,
    color: colors.navy,
    textAlign: 'center',
  },
});
