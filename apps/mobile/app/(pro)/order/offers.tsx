import React from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, LoadingScreen, ScreenHeader } from '../../../src/components/ui';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { useCreateJoinRequest } from '../../../src/hooks/pro/useProMutations';
import { useProOpenSlots } from '../../../src/hooks/pro/useProQueries';
import { getErrorMessage } from '../../../src/lib/errors';

export default function ProOffersScreen() {
  const { t } = useTranslation();
  const openSlotsQuery = useProOpenSlots();
  const createJoinRequest = useCreateJoinRequest();

  if (openSlotsQuery.isLoading) {
    return <LoadingScreen />;
  }

  const slots = openSlotsQuery.data ?? [];

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('pro.openSlotsJoinRequests')} />

      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
            <Card style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name={
                      item.serviceType === 'menage'
                        ? 'broom'
                        : item.serviceType === 'cuisine'
                          ? 'chef-hat'
                          : 'baby-face-outline'
                    }
                    size={spacing.lg + spacing.xs}
                    color={colors.navy}
                  />
                </View>
                <View style={styles.topInfo}>
                  <Text style={styles.title}>{t(`booking.${item.serviceType}`)}</Text>
                  <Text style={styles.meta}>{item.location}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="people-outline" size={spacing.md + spacing.xs} color={colors.clay} />
                  <Text style={styles.metaPillText}>{t('pro.slots')}: {item.filledSlots}/{item.totalSlots}</Text>
                </View>
                <Text style={styles.price}>{item.finalPrice ?? item.floorPrice} MAD</Text>
              </View>

              <Button
                variant="primary"
                label={t('pro.joinRequest')}
                loading={createJoinRequest.isPending}
                onPress={() => {
                  createJoinRequest.mutate(
                    { orderId: item.id },
                    {
                      onError(error) {
                        Alert.alert(t('pro.requestFailedTitle'), getErrorMessage(error, t('pro.requestFailedMessage')));
                      },
                      onSuccess() {
                        Alert.alert(t('pro.requestSentTitle'), t('pro.requestSentMessage'));
                      },
                    },
                  );
                }}
              />
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.empty}>{t('pro.noOpenSlots')}</Text>
          </Card>
        }
      />
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
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
  card: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: spacing['2xl'] + spacing.sm,
    height: spacing['2xl'] + spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  title: { ...textStyles.h2, color: colors.navy },
  meta: { ...textStyles.body, color: colors.textSec },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.clayTint,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + spacing.xs,
  },
  metaPillText: {
    ...textStyles.h3,
    color: colors.clay,
  },
  price: {
    ...textStyles.h2,
    color: colors.navy,
  },
  emptyCard: {
    marginTop: spacing['2xl'],
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  empty: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
