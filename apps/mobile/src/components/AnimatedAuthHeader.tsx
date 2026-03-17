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
import { LinearGradient } from 'expo-linear-gradient';
import { BablooLogo } from './BablooLogo';
import {
  CleaningIcon,
  CookingIcon,
  BabysittingIcon,
  PlumbingIcon,
  ElectricalIcon,
  ITIcon,
  StarOutlineIcon,
  HomeIcon,
  ClockIcon,
  LocationPinIcon,
  LoyaltyIcon,
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
  plumbing: (p) => <PlumbingIcon {...p} />,
  electrical: (p) => <ElectricalIcon {...p} />,
  it: (p) => <ITIcon {...p} />,
  star: (p) => <StarOutlineIcon {...p} />,
  home: (p) => <HomeIcon {...p} />,
  clock: (p) => <ClockIcon {...p} />,
  location: (p) => <LocationPinIcon {...p} />,
  heart: (p) => <LoyaltyIcon {...p} />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Floating icon placements — scattered around the logo
// ─────────────────────────────────────────────────────────────────────────────

interface Placement {
  icon: string;
  /** Position as fraction of container width/height */
  x: number;
  y: number;
  size: number;
  opacity: number;
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
  // Top area
  { icon: 'cleaning',    x: 0.14, y: 0.12, size: 34, opacity: 0.14, amplitude: 6,  period: 5200, phase: 0,     rockDeg: 4 },
  { icon: 'star',        x: 0.44, y: 0.04, size: 20, opacity: 0.10, amplitude: 4,  period: 4600, phase: 2.8,   rockDeg: 6 },
  { icon: 'cooking',     x: 0.76, y: 0.10, size: 32, opacity: 0.13, amplitude: 5,  period: 5800, phase: 1.1,   rockDeg: 3 },

  // Middle sides
  { icon: 'plumbing',    x: 0.04, y: 0.46, size: 26, opacity: 0.10, amplitude: 5,  period: 6200, phase: 3.5,   rockDeg: 5 },
  { icon: 'electrical',  x: 0.92, y: 0.40, size: 24, opacity: 0.11, amplitude: 4,  period: 5500, phase: 0.7,   rockDeg: 4 },

  // Lower area
  { icon: 'babysitting', x: 0.22, y: 0.72, size: 28, opacity: 0.12, amplitude: 6,  period: 5000, phase: 4.2,   rockDeg: 3 },
  { icon: 'it',          x: 0.68, y: 0.74, size: 26, opacity: 0.10, amplitude: 5,  period: 5400, phase: 1.8,   rockDeg: 5 },
  { icon: 'home',        x: 0.50, y: 0.82, size: 22, opacity: 0.09, amplitude: 4,  period: 6000, phase: 3.0,   rockDeg: 4 },

  // Extra scattered small ones for density
  { icon: 'heart',       x: 0.86, y: 0.68, size: 18, opacity: 0.08, amplitude: 3,  period: 6800, phase: 5.2,   rockDeg: 6 },
  { icon: 'clock',       x: 0.08, y: 0.82, size: 18, opacity: 0.07, amplitude: 3,  period: 7000, phase: 2.2,   rockDeg: 5 },
  { icon: 'location',    x: 0.62, y: 0.06, size: 18, opacity: 0.08, amplitude: 4,  period: 6400, phase: 4.6,   rockDeg: 4 },
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
      {IconFn({ size: placement.size, color: colors.navy })}
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
          <FloatingIcon key={p.icon} placement={p} />
        ))}
      </Animated.View>

      {/* Centered logo */}
      <View style={styles.logo}>
        <BablooLogo size={96} color={colors.navy} />
      </View>

      {/* Bottom gradient fade — smooth multi-stop to eliminate visible edge */}
      <LinearGradient
        colors={[
          'transparent',
          `${colors.bg}40`,
          `${colors.bg}AA`,
          colors.bg,
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />
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
  },
  logo: {
    zIndex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HEADER_H * 0.5,
    zIndex: 2,
  },
});
