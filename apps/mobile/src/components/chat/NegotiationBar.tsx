import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { isValidOfferAmount } from '@babloo/shared/pricing';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { colors, radius, shadows, spacing, textStyles } from '../../constants/theme';

type NegotiationBarProps = {
  floorPrice: number;
  onSendOffer: (amount: number) => void;
  onAcceptOffer?: () => void;
  pendingOfferFromOther?: { id: string; amount: number } | null;
  isSending: boolean;
  collapsed?: boolean;
};

const STEP = 5;
const CEILING_MULTIPLIER = 2.5;

export function NegotiationBar({
  floorPrice,
  onSendOffer,
  onAcceptOffer,
  pendingOfferFromOther,
  isSending,
  collapsed = false,
}: NegotiationBarProps) {
  const { t } = useTranslation();
  const ceiling = useMemo(() => Math.round(floorPrice * CEILING_MULTIPLIER), [floorPrice]);
  const [amount, setAmount] = useState(floorPrice);

  const snappedAmount = useMemo(() => {
    const stepped = Math.round(amount / STEP) * STEP;
    return Math.max(floorPrice, Math.min(ceiling, stepped));
  }, [amount, ceiling, floorPrice]);

  const presets = [
    { label: t('orders.floorPrice'), value: floorPrice },
    { label: '+10%', value: Math.round(floorPrice * 1.1) },
    { label: '+20%', value: Math.round(floorPrice * 1.2) },
    { label: '+30%', value: Math.round(floorPrice * 1.3) },
  ];

  const canSend = isValidOfferAmount(snappedAmount, floorPrice, ceiling);

  return (
    <View style={styles.container}>
      {pendingOfferFromOther ? (
        <View style={styles.pendingBox}>
          <View style={styles.pendingTextWrap}>
            <Text style={styles.pendingLabel}>{t('chat.pendingOffer')}</Text>
            <Text style={styles.pendingAmount}>{pendingOfferFromOther.amount} MAD</Text>
          </View>
          <Button
            variant="xs"
            label={t('chat.accept')}
            onPress={onAcceptOffer ?? (() => undefined)}
            disabled={isSending}
          />
        </View>
      ) : null}

      <View style={styles.heroRow}>
        <Ionicons name="cash-outline" size={spacing.lg + spacing.xs} color={colors.clay} />
        <Text style={styles.heroAmount}>{snappedAmount} MAD</Text>
      </View>

      {!collapsed ? (
        <>
          <Slider
            style={styles.slider}
            minimumValue={floorPrice}
            maximumValue={ceiling}
            step={STEP}
            value={snappedAmount}
            onValueChange={setAmount}
            minimumTrackTintColor={colors.clay}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.navy}
          />

          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>{floorPrice} MAD</Text>
            <Text style={styles.rangeText}>{ceiling} MAD</Text>
          </View>

          <View style={styles.presetRow}>
            {presets.map((preset) => (
              <Pressable
                key={preset.label}
                style={({ pressed }) => [
                  styles.presetBtn,
                  preset.value === snappedAmount && styles.presetBtnActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setAmount(preset.value)}
              >
                <Text style={[styles.presetLabel, preset.value === snappedAmount && styles.presetLabelActive]}>
                  {preset.label}
                </Text>
                <Text style={styles.presetValue}>{preset.value} MAD</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Button
        variant="clay"
        label={`${t('chat.offerAmount')} ${snappedAmount} MAD`}
        onPress={() => onSendOffer(snappedAmount)}
        disabled={isSending || !canSend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: spacing.xs / spacing.xs,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pendingBox: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.successBg,
    borderWidth: spacing.xs / spacing.xs,
    borderColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingTextWrap: {
    gap: spacing.xs,
  },
  pendingLabel: {
    ...textStyles.label,
    color: colors.success,
  },
  pendingAmount: {
    ...textStyles.h2,
    color: colors.navy,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  heroAmount: {
    ...textStyles.display,
    color: colors.navy,
    fontSize: spacing['2xl'],
    lineHeight: spacing['2xl'] + spacing.sm,
  },
  slider: {
    width: '100%',
    height: spacing['2xl'] + spacing.sm,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  rangeText: {
    ...textStyles.body,
    color: colors.textMuted,
    fontSize: spacing.sm + spacing.xs - spacing.xs / 2,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  presetBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: spacing.xs / spacing.xs,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: spacing.xs,
  },
  presetBtnActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navyTint07,
    ...shadows.sm,
  },
  presetLabel: {
    ...textStyles.h3,
    color: colors.navy,
  },
  presetLabelActive: {
    color: colors.clay,
  },
  presetValue: {
    ...textStyles.body,
    color: colors.textSec,
    fontSize: spacing.sm + spacing.xs - spacing.xs / 2,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
