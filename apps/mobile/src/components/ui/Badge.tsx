import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../../constants/theme';

type BadgeVariant = 'default' | 'navy' | 'success' | 'warning' | 'clay' | 'danger';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
  },
});

const variantStyles = StyleSheet.create({
  default: { backgroundColor: colors.bgAlt },
  navy: { backgroundColor: colors.navy },
  success: { backgroundColor: colors.successBg },
  warning: { backgroundColor: colors.warningBg },
  clay: { backgroundColor: colors.clay },
  danger: { backgroundColor: colors.dangerBg },
});

const textStyles = StyleSheet.create({
  default: { color: colors.navy },
  navy: { color: colors.white },
  success: { color: colors.success },
  warning: { color: colors.warning },
  clay: { color: colors.white },
  danger: { color: colors.error },
});
