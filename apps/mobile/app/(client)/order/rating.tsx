import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BackHeader, Button, Card, LoadingScreen } from '../../../src/components/ui';
import { colors, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useOrder } from '../../../src/hooks/orders/useOrderQueries';
import { useRateOrder } from '../../../src/hooks/orders/useOrderMutations';
import { getErrorMessage } from '../../../src/lib/errors';

export default function OrderRatingScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = params.orderId ?? '';
  const orderQuery = useOrder(orderId);
  const rateOrder = useRateOrder();

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  if (orderQuery.isLoading || !orderQuery.data) {
    return <LoadingScreen />;
  }

  if (orderQuery.data.rating) {
    return (
      <SafeAreaView style={styles.container}>
        <BackHeader title={t('rating.title')} onBack={() => router.back()} />
        <View style={styles.centered}>
          <Card style={styles.alreadyRatedCard}>
            <Text style={styles.title}>{t('rating.alreadyRated')}</Text>
            <Button variant="outline" label={t('rating.backToOrder')} onPress={() => router.back()} />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title={t('rating.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.block}>
          <Text style={styles.blockTitle}>{t('rating.stars')}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= stars;
              return (
                <Pressable
                  key={value}
                  onPress={() => setStars(value)}
                  style={({ pressed }) => [styles.starBtn, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={active ? 'star' : 'star-outline'}
                    size={spacing.lg + spacing.md}
                    color={active ? colors.clay : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.meta}>{t('rating.starValue', { count: stars })}</Text>
        </Card>

        <Card style={styles.block}>
          <Text style={styles.blockTitle}>{t('rating.comment')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('rating.commentPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
          />
        </Card>

        <Button
          variant="primary"
          label={t('rating.submit')}
          loading={rateOrder.isPending}
          onPress={() => {
            rateOrder.mutate(
              {
                orderId,
                stars,
                comment: comment.trim() || undefined,
              },
              {
                onError(error) {
                  Alert.alert(
                    t('rating.submitFailedTitle'),
                    getErrorMessage(error, t('rating.submitFailedMessage')),
                  );
                },
                async onSuccess() {
                  await orderQuery.refetch();
                  Alert.alert(t('rating.successTitle'), t('rating.successMessage'));
                  router.back();
                },
              },
            );
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  alreadyRatedCard: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
    textAlign: 'center',
  },
  block: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  blockTitle: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starBtn: {
    width: spacing['2xl'] + spacing.sm,
    height: spacing['2xl'] + spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.clayTint,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  meta: {
    ...textStyles.body,
    color: colors.textSec,
    textAlign: 'center',
  },
  input: {
    minHeight: spacing['2xl'] * 3,
    borderWidth: spacing.xs / spacing.xs,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm + spacing.xs,
    textAlignVertical: 'top',
    color: colors.navy,
    fontFamily: 'DMSans_400Regular',
    fontSize: spacing.sm + spacing.xs + spacing.xs / 2,
    backgroundColor: colors.surface,
  },
});
