import React from 'react';
import { View, type ViewProps } from 'react-native';

type GlassStyle = 'clear' | 'regular' | 'none';

type GlassEffectStyleConfig = {
  animate?: boolean;
  animationDuration?: number;
  style: GlassStyle;
};

type GlassColorScheme = 'auto' | 'light' | 'dark';

type GlassViewProps = ViewProps & {
  colorScheme?: GlassColorScheme;
  glassEffectStyle?: GlassStyle | GlassEffectStyleConfig;
  isInteractive?: boolean;
  tintColor?: string;
};

type GlassContainerProps = ViewProps & {
  spacing?: number;
};

export function isLiquidGlassAvailable() {
  return false;
}

export function isGlassEffectAPIAvailable() {
  return false;
}

export function GlassView({ children, ...props }: GlassViewProps) {
  return <View {...props}>{children}</View>;
}

export function GlassContainer({ children, ...props }: GlassContainerProps) {
  return <View {...props}>{children}</View>;
}

export default {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
};

export type {
  GlassColorScheme,
  GlassContainerProps,
  GlassEffectStyleConfig,
  GlassStyle,
  GlassViewProps,
};
