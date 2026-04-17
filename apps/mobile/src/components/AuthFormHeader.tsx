import React from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GrainientBackground } from './GrainientBackground';
import { TypeText } from './TypeText';
import { colors, radius, spacing, textStyles } from '../constants/theme';

interface AuthFormHeaderProps {
  /** Big display title (e.g. "Bon retour") */
  title: string;
  /** Subtitle below the title */
  subtitle: string;
  /** Typing speed for the title */
  typeSpeed?: number;
  /** Optional back handler */
  onBack?: () => void;
  /** Reports the bottom edge of the header block */
  onHeaderLayout?: (bottom: number) => void;
}

/**
 * Full-screen Grainient background for auth form pages.
 * Each form page gets its own GrainientBackground WebView.
 * The navy backgroundColor of the WebView matches the gradient's dominant color,
 * so the brief loading flash is imperceptible.
 */
export function AuthFormHeader({
  title,
  subtitle,
  typeSpeed = 80,
  onBack,
  onHeaderLayout,
}: AuthFormHeaderProps) {
  const router = useRouter();

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    onHeaderLayout?.(y + height);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.backgroundLayer} pointerEvents="none">
        <GrainientBackground />

        <LinearGradient
          colors={['rgba(14,20,66,0.35)', 'rgba(14,20,66,0.0)', 'rgba(14,20,66,0.25)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <View style={styles.topContent} pointerEvents="box-none" onLayout={handleHeaderLayout}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={onBack ?? (() => router.back())}
        >
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>

        <View style={styles.titleBlock}>
          <TypeText
            text={title}
            suffix="."
            suffixStyle={styles.titleDot}
            style={styles.title}
            speed={typeSpeed}
            delay={300}
          />
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topContent: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  titleBlock: {
    gap: spacing.xs,
  },
  title: {
    ...textStyles.display,
    color: colors.white,
    fontSize: 36,
    lineHeight: 42,
  },
  titleDot: {
    color: colors.clay,
  },
  subtitle: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.65)',
  },
});
