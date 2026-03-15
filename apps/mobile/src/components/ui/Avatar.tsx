import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  name: string;
  size?: AvatarSize;
};

const sizeMap: Record<AvatarSize, number> = {
  sm: spacing.sm * 4,
  md: spacing.lg * 2,
  lg: spacing.md * 4,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 12,
  md: 15,
  lg: 20,
};

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'B';

  const avatarSize = sizeMap[size];

  return (
    <View
      style={[
        styles.base,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: radius.full,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: fontSizeMap[size] }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontFamily: fonts.dmSans.semiBold,
  },
});
