import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GrainientBackground } from './GrainientBackground';

/**
 * Full-screen Grainient shader background.
 * The logo is now inside the card (index.tsx), not here.
 *
 * Layers (back → front):
 * 1. Navy background (container bg)
 * 2. Grainient WebGL shader
 * 3. Subtle dark overlay for depth
 */
export function AnimatedAuthHeader() {
  return (
    <View style={styles.container} pointerEvents="none">
      <GrainientBackground />

      <LinearGradient
        colors={['rgba(14,20,66,0.35)', 'rgba(14,20,66,0.0)', 'rgba(14,20,66,0.25)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
