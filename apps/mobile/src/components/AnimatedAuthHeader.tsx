import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BablooLogo } from './BablooLogo';
import { colors } from '../constants/theme';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.4;

const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = CONTAINER_HEIGHT / 2;

// ---------------------------------------------------------------------------
// Blob configuration
// ---------------------------------------------------------------------------

interface BlobConfig {
  id: string;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
  orbitRx: number;
  orbitRy: number;
  period: number;
  phase: number;
  reverse?: boolean;
}

const BACK_BLOBS: BlobConfig[] = [
  {
    id: 'a1',
    rx: 90,
    ry: 90,
    color: colors.navy,
    opacity: 0.18,
    orbitRx: 110,
    orbitRy: 100,
    period: 14000,
    phase: 0,
  },
  {
    id: 'a2',
    rx: 78,
    ry: 72,
    color: colors.textSec,
    opacity: 0.15,
    orbitRx: 90,
    orbitRy: 120,
    period: 18000,
    phase: Math.PI * 0.7,
  },
  {
    id: 'a3',
    rx: 65,
    ry: 65,
    color: colors.clay,
    opacity: 0.12,
    orbitRx: 100,
    orbitRy: 80,
    period: 16000,
    phase: Math.PI * 1.3,
  },
];

const FRONT_BLOBS: BlobConfig[] = [
  {
    id: 'b1',
    rx: 40,
    ry: 40,
    color: colors.navy,
    opacity: 0.25,
    orbitRx: 70,
    orbitRy: 65,
    period: 8000,
    phase: Math.PI * 0.5,
    reverse: true,
  },
  {
    id: 'b2',
    rx: 33,
    ry: 29,
    color: colors.clay,
    opacity: 0.20,
    orbitRx: 80,
    orbitRy: 50,
    period: 10000,
    phase: Math.PI * 1.1,
  },
];

// ---------------------------------------------------------------------------
// Animated blob component
// ---------------------------------------------------------------------------

interface AnimatedBlobProps {
  config: BlobConfig;
  centerX: number;
  centerY: number;
}

function AnimatedBlob({ config, centerX, centerY }: AnimatedBlobProps) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: config.period,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const direction = config.reverse ? -1 : 1;
    const angle = direction * progress.value + config.phase;
    return {
      cx: centerX + config.orbitRx * Math.cos(angle),
      cy: centerY + config.orbitRy * Math.sin(angle),
    };
  });

  const gradientId = `grad-${config.id}`;

  return (
    <>
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={config.color} stopOpacity={config.opacity} />
          <Stop offset="1" stopColor={config.color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <AnimatedEllipse
        animatedProps={animatedProps}
        rx={config.rx}
        ry={config.ry}
        fill={`url(#${gradientId})`}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AnimatedAuthHeaderProps {
  scrollY?: SharedValue<number>;
}

export function AnimatedAuthHeader({ scrollY }: AnimatedAuthHeaderProps) {
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (scrollY?.value ?? 0) * 0.3 }],
  }));

  return (
    <View style={styles.container}>
      {/* Parallax wrapper for blobs — single SVG, back blobs first then front */}
      <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]}>
        <Svg
          style={StyleSheet.absoluteFill}
          width={SCREEN_WIDTH}
          height={CONTAINER_HEIGHT}
        >
          {BACK_BLOBS.map((blob) => (
            <AnimatedBlob
              key={blob.id}
              config={blob}
              centerX={CENTER_X}
              centerY={CENTER_Y}
            />
          ))}
          {FRONT_BLOBS.map((blob) => (
            <AnimatedBlob
              key={blob.id}
              config={blob}
              centerX={CENTER_X}
              centerY={CENTER_Y}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Logo — rendered directly, no container background */}
      <View style={styles.logoWrapper}>
        <BablooLogo size={80} color={colors.navy} />
      </View>

      {/* Bottom gradient fade */}
      <LinearGradient
        colors={['transparent', 'rgba(237, 238, 246, 0.6)', colors.bg]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoWrapper: {
    zIndex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTAINER_HEIGHT * 0.3,
    zIndex: 2,
  },
});
