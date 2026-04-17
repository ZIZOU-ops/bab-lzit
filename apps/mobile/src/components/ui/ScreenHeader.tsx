import React, { type ReactNode } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { colors, fonts, spacing } from '../../constants/theme';

type ScreenHeaderProps = {
  title: string;
  rightElement?: ReactNode;
  onBack?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  showBack?: boolean;
  backgroundColor?: string;
};

function WhiteHeaderArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 402 205" fill="none" preserveAspectRatio="none">
      <Ellipse cx="190" cy="68.7254" rx="325" ry="129.725" transform="rotate(-180 190 68.7254)" fill={colors.white} />
      <Path
        d="M-137.812 68.7254C-135.938 68.7254 -134.062 68.7254 -132.188 68.7254C-131.904 44.5462 -113.952 24.6838 -94.5535 10.5945C-11.9158 -43.5345 92.0877 -53.9249 190 -54.6719C251.815 -54.1801 313.75 -47.4401 373.048 -31.0085C428.37 -14.3096 501.539 11.666 507.5 68.7254C501.539 125.785 428.37 151.76 373.048 168.459C313.751 184.891 251.815 191.631 190 192.123C92.0877 191.376 -11.9158 180.985 -94.5536 126.856C-113.953 112.767 -131.904 92.9046 -132.188 68.7254C-134.062 68.7254 -135.938 68.7254 -137.812 68.7254C-138.097 95.8667 -118.815 117.671 -98.983 132.792C-14.3365 190.837 90.4832 202.651 190 204.779C252.782 205.056 315.811 198.855 376.893 182.351C433.464 164.003 511.575 144.335 522.5 68.7254C511.575 -6.88367 433.464 -26.552 376.893 -44.9003C315.811 -61.4039 252.782 -67.6053 190 -67.3281C90.4833 -65.1999 -14.3365 -53.386 -98.983 4.65874C-118.815 19.7794 -138.097 41.5841 -137.812 68.7254ZM-132.188 68.7254H-137.812H-132.188Z"
        fill={colors.border}
      />
    </Svg>
  );
}

export function ScreenHeader({
  title,
  rightElement,
  onBack,
  onLayout,
  showBack = true,
  backgroundColor = colors.bg,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topInset = Math.max(insets.top - 4, 10);
  const headerHeight = Math.min(132, Math.max(112, Math.round(width * (205 / 402)) - 74));

  return (
    <View
      style={[
        styles.container,
        {
          height: headerHeight,
          paddingTop: topInset,
        },
      ]}
      onLayout={onLayout}
    >
      <View
        pointerEvents="none"
        style={[styles.bleedFill, { backgroundColor }]}
      />
      <View pointerEvents="none" style={styles.background}>
        <WhiteHeaderArt />
      </View>
      <View style={styles.row}>
        <View style={styles.sideSlot}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              onPress={onBack ?? (() => router.back())}
            >
              <Ionicons name="chevron-back" size={28} color={colors.navy} />
            </Pressable>
          ) : null}
        </View>

        <Text
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {title}
        </Text>

        <View style={styles.rightSlot}>{rightElement}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    marginBottom: -12,
    zIndex: 20,
  },
  bleedFill: {
    ...StyleSheet.absoluteFillObject,
    top: -120,
    bottom: 54,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    gap: spacing.sm,
    marginTop: -6,
  },
  sideSlot: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rightSlot: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  backBtnPressed: {
    opacity: 0.55,
  },
  title: {
    flex: 1,
    fontFamily: fonts.nunito.bold,
    fontSize: 23,
    lineHeight: 28,
    color: colors.navy,
    textAlign: 'center',
    marginTop: 12,
  },
});
