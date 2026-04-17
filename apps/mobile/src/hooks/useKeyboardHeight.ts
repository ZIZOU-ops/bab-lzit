import { useEffect, useRef } from 'react';
import { Animated, Easing, Keyboard, KeyboardEvent, Platform } from 'react-native';

const DEFAULT_DURATION = 250;

export function useKeyboardHeight() {
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animateTo = (toValue: number, event?: KeyboardEvent) => {
      Animated.timing(keyboardHeight, {
        toValue,
        duration: event?.duration ?? DEFAULT_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    };

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      animateTo(event.endCoordinates.height, event);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      animateTo(0, event);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardHeight]);

  return keyboardHeight;
}
