import { useRef, useState } from 'react';
import { Animated, LayoutChangeEvent } from 'react-native';
import { spacing } from '../constants/theme';
import { useKeyboardHeight } from './useKeyboardHeight';

interface UseClampedKeyboardLiftOptions {
  keyboardGap?: number;
  headerGap?: number;
}

export function useClampedKeyboardLift({
  keyboardGap = spacing.md,
  headerGap = spacing.lg,
}: UseClampedKeyboardLiftOptions = {}) {
  const keyboardHeight = useKeyboardHeight();
  const zero = useRef(new Animated.Value(0)).current;

  const [containerHeight, setContainerHeight] = useState(0);
  const [cardTop, setCardTop] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const [protectedBottom, setProtectedBottom] = useState(0);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  const onCardLayout = (event: LayoutChangeEvent) => {
    setCardTop(event.nativeEvent.layout.y);
    setCardHeight(event.nativeEvent.layout.height);
  };

  const cardBottom = cardTop + cardHeight;
  const maxLift = Math.max(0, cardTop - protectedBottom - headerGap);
  const threshold = Math.max(0, containerHeight - cardBottom - keyboardGap);

  if (containerHeight <= 0 || cardHeight <= 0 || maxLift <= 0) {
    return {
      translateY: zero,
      onContainerLayout,
      onCardLayout,
      setProtectedBottom,
    };
  }

  const inputStart = Math.max(0.001, threshold);

  return {
    translateY: keyboardHeight.interpolate({
      inputRange: [0, inputStart, inputStart + maxLift],
      outputRange: [0, 0, -maxLift],
      extrapolate: 'clamp',
    }),
    onContainerLayout,
    onCardLayout,
    setProtectedBottom,
  };
}
