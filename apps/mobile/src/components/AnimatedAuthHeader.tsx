import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BablooLogo } from './BablooLogo';
import {
  CleaningIcon,
  CookingIcon,
  BabysittingIcon,
  ElectricalIcon,
  ITIcon,
  HomeIcon,
} from './icons';
import { colors } from '../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const HEADER_H = SH * 0.28;

// ─────────────────────────────────────────────────────────────────────────────
// Icon registry — maps keys to components from the shared icon library
// ─────────────────────────────────────────────────────────────────────────────

type IconRenderFn = (props: { size: number; color: string }) => React.ReactElement;

const ICON_MAP: Record<string, IconRenderFn> = {
  cleaning: (p) => <CleaningIcon {...p} />,
  cooking: (p) => <CookingIcon {...p} />,
  babysitting: (p) => <BabysittingIcon {...p} />,
  electrical: (p) => <ElectricalIcon {...p} />,
  it: (p) => <ITIcon {...p} />,
  home: (p) => <HomeIcon {...p} />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Floating icon placements — scattered around the logo
// ─────────────────────────────────────────────────────────────────────────────

interface Placement {
  /** Unique key for React */
  key: string;
  icon: string;
  /** Position as fraction of container width/height */
  x: number;
  y: number;
  size: number;
  opacity: number;
  /** Icon stroke color */
  color: string;
  /** Vertical float amplitude in px */
  amplitude: number;
  /** Full cycle duration in ms */
  period: number;
  /** Phase offset in radians */
  phase: number;
  /** Subtle rotation amplitude in degrees */
  rockDeg: number;
}

const PLACEMENTS: Placement[] = [
  // ── Top row ──
  { key: 'clean1',  icon: 'cleaning',    x: 0.12, y: 0.10, size: 34, opacity: 1, color: colors.clayLight, amplitude: 6, period: 5200, phase: 0,   rockDeg: 4 },
  { key: 'cook1',   icon: 'cooking',     x: 0.48, y: 0.06, size: 28, opacity: 1, color: colors.navy,      amplitude: 4, period: 5800, phase: 1.1, rockDeg: 3 },
  { key: 'elec1',   icon: 'electrical',  x: 0.82, y: 0.08, size: 26, opacity: 1, color: colors.clayLight, amplitude: 5, period: 4800, phase: 2.4, rockDeg: 5 },

  // ── Middle left ──
  { key: 'baby1',   icon: 'babysitting', x: 0.05, y: 0.42, size: 30, opacity: 1, color: colors.navy,      amplitude: 5, period: 6200, phase: 3.5, rockDeg: 4 },
  { key: 'it1',     icon: 'it',          x: 0.08, y: 0.72, size: 22, opacity: 1, color: colors.clayLight, amplitude: 4, period: 6800, phase: 5.0, rockDeg: 3 },

  // ── Middle right ──
  { key: 'home1',   icon: 'home',        x: 0.92, y: 0.38, size: 26, opacity: 1, color: colors.navy,      amplitude: 4, period: 5500, phase: 0.7, rockDeg: 4 },
  { key: 'cook2',   icon: 'cooking',     x: 0.90, y: 0.65, size: 20, opacity: 1, color: colors.clayLight, amplitude: 3, period: 7000, phase: 4.0, rockDeg: 5 },

  // ── Bottom row ──
  { key: 'baby2',   icon: 'babysitting', x: 0.24, y: 0.78, size: 24, opacity: 1, color: colors.clayLight, amplitude: 5, period: 5000, phase: 4.2, rockDeg: 3 },
  { key: 'elec2',   icon: 'electrical',  x: 0.52, y: 0.84, size: 20, opacity: 1, color: colors.navy,      amplitude: 4, period: 6400, phase: 1.6, rockDeg: 4 },
  { key: 'clean2',  icon: 'cleaning',    x: 0.72, y: 0.76, size: 26, opacity: 1, color: colors.navy,      amplitude: 5, period: 5400, phase: 2.8, rockDeg: 5 },
  { key: 'it2',     icon: 'it',          x: 0.38, y: 0.14, size: 20, opacity: 1, color: colors.navy,      amplitude: 3, period: 6000, phase: 3.2, rockDeg: 3 },
  { key: 'home2',   icon: 'home',        x: 0.65, y: 0.50, size: 18, opacity: 1, color: colors.clayLight, amplitude: 3, period: 7200, phase: 5.5, rockDeg: 4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Floating icon — smooth sinusoidal translateY + subtle scale + gentle rock
// Inspired by the "breathing" feel of Claude's thinking animation
// ─────────────────────────────────────────────────────────────────────────────

function FloatingIcon({ placement }: { placement: Placement }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: placement.period,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    const t = progress.value + placement.phase;
    return {
      transform: [
        { translateY: placement.amplitude * Math.sin(t) },
        { scale: 1 + 0.04 * Math.sin(t * 0.6) },
        { rotate: `${placement.rockDeg * Math.sin(t * 0.4)}deg` },
      ],
    };
  });

  const IconFn = ICON_MAP[placement.icon];
  if (!IconFn) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: placement.x * SW - placement.size / 2,
          top: placement.y * HEADER_H - placement.size / 2,
          opacity: placement.opacity,
        },
        animStyle,
      ]}
    >
      {IconFn({ size: placement.size, color: placement.color })}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedAuthHeaderProps {
  scrollY?: SharedValue<number>;
}

export function AnimatedAuthHeader({ scrollY }: AnimatedAuthHeaderProps) {
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (scrollY?.value ?? 0) * 0.35 }],
  }));

  return (
    <View style={styles.wrapper}>
      {/* Floating service icons with parallax */}
      <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]}>
        {PLACEMENTS.map((p) => (
          <FloatingIcon key={p.key} placement={p} />
        ))}
      </Animated.View>

      {/* Centered logo */}
      <View style={styles.logo}>
        <BablooLogo size={110} />
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    height: HEADER_H,
    width: SW,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  logo: {
    zIndex: 1,
  },
});
