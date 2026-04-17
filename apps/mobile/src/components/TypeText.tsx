import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, type TextStyle, type StyleProp } from 'react-native';

interface TypeTextProps {
  /** The full text to type out */
  text: string;
  /** Optional suffix rendered in a different color (e.g. the clay dot) */
  suffix?: string;
  /** Style applied to the suffix */
  suffixStyle?: StyleProp<TextStyle>;
  /** Typing speed in ms per character */
  speed?: number;
  /** Delay before typing starts (ms) */
  delay?: number;
  /** Style applied to the text */
  style?: StyleProp<TextStyle>;
}

/**
 * Typing animation component for React Native.
 * Types out text character by character with a blinking | cursor.
 * Cursor keeps blinking after typing, then disappears.
 */
export function TypeText({
  text,
  suffix,
  suffixStyle,
  speed = 60,
  delay = 200,
  style,
}: TypeTextProps) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [showSuffix, setShowSuffix] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const typingDone = displayedCount >= text.length;

  // Fade in container
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 150,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeIn, delay]);

  // Blink cursor with setInterval (simple toggle)
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorOn((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Type characters one by one
  useEffect(() => {
    if (typingDone) return;

    const timeout = setTimeout(
      () => setDisplayedCount((c) => c + 1),
      displayedCount === 0 ? delay : speed,
    );

    return () => clearTimeout(timeout);
  }, [displayedCount, typingDone, speed, delay]);

  // When typing finishes: show suffix, keep cursor blinking 2s then hide
  useEffect(() => {
    if (!typingDone) return;

    setShowSuffix(true);

    const timeout = setTimeout(() => {
      setCursorVisible(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [typingDone]);

  return (
    <Animated.Text style={[style, { opacity: fadeIn }]}>
      {text.slice(0, displayedCount)}
      {showSuffix && suffix ? <Text style={suffixStyle}>{suffix}</Text> : null}
      {cursorVisible ? (
        <Text style={[style, { fontWeight: '300', opacity: cursorOn ? 1 : 0 }]}>|</Text>
      ) : null}
    </Animated.Text>
  );
}
