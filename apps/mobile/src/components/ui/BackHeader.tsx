import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, textStyles } from '../../constants/theme';

type BackHeaderProps = {
  title: string;
  rightElement?: ReactNode;
  onBack?: () => void;
};

export function BackHeader({ title, rightElement, onBack }: BackHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={onBack ?? (() => router.back())}
        >
          <Ionicons name="chevron-back" size={spacing.lg} color={colors.navy} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.right}>{rightElement}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: spacing.lg * 2,
    height: spacing.lg * 2,
    borderRadius: radius.full,
    backgroundColor: colors.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  title: {
    ...textStyles.h3,
    color: colors.navy,
    flex: 1,
    fontSize: 18,
  },
  right: {
    minWidth: spacing.lg * 2,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
