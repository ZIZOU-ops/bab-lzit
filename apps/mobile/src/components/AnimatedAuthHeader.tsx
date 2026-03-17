import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
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
  ShirtIcon,
  LeafIcon,
  PawIcon,
  BoxIcon,
  PaintRollerIcon,
  SparkleSmallIcon,
} from './icons';
import { colors } from '../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const HEADER_H = SH * 0.28;

// ─────────────────────────────────────────────────────────────────────────────
// Icon registry — 12 unique service icons, no duplicates
// ─────────────────────────────────────────────────────────────────────────────

type IconRenderFn = (props: { size: number; color: string }) => React.ReactElement;

const ICON_MAP: Record<string, IconRenderFn> = {
  cleaning: (p) => <CleaningIcon {...p} />,
  cooking: (p) => <CookingIcon {...p} />,
  babysitting: (p) => <BabysittingIcon {...p} />,
  electrical: (p) => <ElectricalIcon {...p} />,
  it: (p) => <ITIcon {...p} />,
  home: (p) => <HomeIcon {...p} />,
  shirt: (p) => <ShirtIcon {...p} />,
  leaf: (p) => <LeafIcon {...p} />,
  paw: (p) => <PawIcon {...p} />,
  box: (p) => <BoxIcon {...p} />,
  paintroller: (p) => <PaintRollerIcon {...p} />,
  sparkle: (p) => <SparkleSmallIcon {...p} />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Placement config — scattered around logo, alternating navy/orange
// ─────────────────────────────────────────────────────────────────────────────

interface Placement {
  key: string;
  icon: string;
  x: number;
  y: number;
  size: number;
  color: string;
  /** Stagger delay for entrance in ms */
  entranceDelay: number;
  /** Idle float amplitude in px (subtle — Jakub: "barely noticeable") */
  amplitude: number;
  /** Idle float period in ms */
  period: number;
  /** Phase offset for organic feel */
  phase: number;
  /** Gentle rock in degrees */
  rockDeg: number;
}

const PLACEMENTS: Placement[] = [
  // ── Top arc ──
  { key: 'cleaning',    icon: 'cleaning',    x: 0.10, y: 0.12, size: 32, color: colors.clayLight, entranceDelay: 0,    amplitude: 4, period: 5500, phase: 0,   rockDeg: 3 },
  { key: 'sparkle',     icon: 'sparkle',     x: 0.36, y: 0.06, size: 22, color: colors.navy,      entranceDelay: 80,   amplitude: 3, period: 6200, phase: 1.2, rockDeg: 2 },
  { key: 'cooking',     icon: 'cooking',     x: 0.60, y: 0.04, size: 28, color: colors.clayLight, entranceDelay: 160,  amplitude: 3, period: 5800, phase: 2.4, rockDeg: 3 },
  { key: 'electrical',  icon: 'electrical',  x: 0.85, y: 0.10, size: 26, color: colors.navy,      entranceDelay: 240,  amplitude: 4, period: 5200, phase: 3.6, rockDeg: 2 },

  // ── Middle sides ──
  { key: 'babysitting', icon: 'babysitting', x: 0.04, y: 0.40, size: 28, color: colors.navy,      entranceDelay: 320,  amplitude: 3, period: 6000, phase: 0.8, rockDeg: 2 },
  { key: 'paw',         icon: 'paw',         x: 0.93, y: 0.36, size: 24, color: colors.clayLight, entranceDelay: 400,  amplitude: 3, period: 6400, phase: 4.0, rockDeg: 3 },

  // ── Lower sides ──
  { key: 'it',          icon: 'it',          x: 0.06, y: 0.70, size: 22, color: colors.clayLight, entranceDelay: 480,  amplitude: 3, period: 6800, phase: 2.0, rockDeg: 2 },
  { key: 'home',        icon: 'home',        x: 0.92, y: 0.65, size: 24, color: colors.navy,      entranceDelay: 560,  amplitude: 4, period: 5600, phase: 5.0, rockDeg: 3 },

  // ── Bottom arc ──
  { key: 'shirt',       icon: 'shirt',       x: 0.18, y: 0.82, size: 24, color: colors.navy,      entranceDelay: 640,  amplitude: 3, period: 7000, phase: 1.5, rockDeg: 2 },
  { key: 'leaf',        icon: 'leaf',        x: 0.38, y: 0.88, size: 20, color: colors.clayLight, entranceDelay: 720,  amplitude: 3, period: 6600, phase: 3.2, rockDeg: 3 },
  { key: 'box',         icon: 'box',         x: 0.60, y: 0.86, size: 22, color: colors.navy,      entranceDelay: 800,  amplitude: 3, period: 5400, phase: 4.8, rockDeg: 2 },
  { key: 'paintroller', icon: 'paintroller', x: 0.80, y: 0.78, size: 24, color: colors.clayLight, entranceDelay: 880,  amplitude: 4, period: 6200, phase: 0.4, rockDeg: 3 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animated icon — staggered entrance (Jakub: materializing) + subtle idle float
//
// Entrance: opacity 0→1, translateY 15→0, scale 0.85→1 (spring, no bounce)
// Idle: gentle sinusoidal translateY + micro-scale + micro-rock
// ─────────────────────────────────────────────────────────────────────────────

const ENTRANCE_SPRING = { damping: 18, stiffness: 90, mass: 1 };

function FloatingIcon({ placement }: { placement: Placement }) {
  const entrance = useSharedValue(0);
  const idle = useSharedValue(0);

  React.useEffect(() => {
    // Phase 1: Materializing entrance with stagger
    entrance.value = withDelay(
      placement.entranceDelay,
      withSpring(1, ENTRANCE_SPRING),
    );

    // Phase 2: Subtle idle floating starts after entrance settles
    idle.value = withDelay(
      placement.entranceDelay + 700,
      withRepeat(
        withTiming(2 * Math.PI, {
          duration: placement.period,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    const e = entrance.value; // 0→1 during entrance
    const t = idle.value + placement.phase;

    // Entrance: translateY from 15 to 0, scale from 0.85 to 1
    // Idle: subtle float layered on top (only when e ≈ 1)
    const entranceY = (1 - e) * 15;
    const idleY = placement.amplitude * Math.sin(t) * e;
    const idleScale = 0.02 * Math.sin(t * 0.6) * e;
    const idleRock = placement.rockDeg * Math.sin(t * 0.4) * e;

    return {
      opacity: e,
      transform: [
        { translateY: entranceY + idleY },
        { scale: 0.85 + 0.15 * e + idleScale },
        { rotate: `${idleRock}deg` },
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
  // Logo entrance — appears mid-sequence (after ~5 icons have materialized)
  const logoEntrance = useSharedValue(0);

  React.useEffect(() => {
    logoEntrance.value = withDelay(
      400,
      withSpring(1, { damping: 14, stiffness: 70, mass: 1 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    'worklet';
    const e = logoEntrance.value;
    return {
      opacity: e,
      transform: [{ scale: 0.9 + 0.1 * e }],
    };
  });

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

      {/* Centered logo with materializing entrance */}
      <Animated.View style={[styles.logo, logoStyle]}>
        <BablooLogo size={110} />
      </Animated.View>
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
