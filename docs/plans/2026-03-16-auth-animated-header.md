# Auth Animated Header Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a premium minimalist animated header to the auth screen with floating blobs orbiting the BablooLogo, fading seamlessly into `#EDEEF6`.

**Architecture:** A single `AnimatedAuthHeader` component using Reanimated shared values to animate 5 SVG blobs (2 depth layers) around a centered logo. A `LinearGradient` overlay handles the fade. The component replaces the current `brandSection` in the auth entry screen.

**Tech Stack:** `react-native-reanimated` (installed), `react-native-svg` (installed), `expo-linear-gradient` (to install)

**Design doc:** `docs/plans/2026-03-16-auth-animated-header-design.md`

---

### Task 1: Install `expo-linear-gradient`

**Files:**
- Modify: `apps/mobile/package.json`

**Step 1: Install the package**

Run from repo root:
```bash
cd apps/mobile && npx expo install expo-linear-gradient
```

**Step 2: Verify installation**

Run: `grep expo-linear-gradient apps/mobile/package.json`
Expected: a line with `"expo-linear-gradient"` and a version number.

**Step 3: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(mobile): add expo-linear-gradient for auth header"
```

---

### Task 2: Create `AnimatedAuthHeader` — Static layout (no animation yet)

**Files:**
- Create: `apps/mobile/src/components/AnimatedAuthHeader.tsx`

**Step 1: Create the component with static blobs and logo**

```tsx
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BablooLogo } from './BablooLogo';
import { colors, radius, shadows, spacing } from '../constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const HEADER_H = SCREEN_H * 0.4;

// Center point for logo and orbits
const CENTER_X = Dimensions.get('window').width / 2;
const CENTER_Y = HEADER_H * 0.45;

interface BlobConfig {
  id: string;
  rx: number; // horizontal radius of blob shape
  ry: number; // vertical radius of blob shape
  color: string;
  opacity: number;
  /** Orbit or motion params — used in Task 3 */
  orbitRx: number;
  orbitRy: number;
  period: number;
  phaseOffset: number;
  layer: 'back' | 'front';
}

const BLOBS: BlobConfig[] = [
  // Back layer — large, slow, atmospheric
  { id: 'a1', rx: 70, ry: 70, color: colors.navy, opacity: 0.07, orbitRx: 110, orbitRy: 100, period: 14000, phaseOffset: 0, layer: 'back' },
  { id: 'a2', rx: 60, ry: 55, color: colors.textSec, opacity: 0.06, orbitRx: 90, orbitRy: 120, period: 18000, phaseOffset: Math.PI * 0.7, layer: 'back' },
  { id: 'a3', rx: 50, ry: 50, color: colors.clay, opacity: 0.05, orbitRx: 100, orbitRy: 80, period: 16000, phaseOffset: Math.PI * 1.3, layer: 'back' },
  // Front layer — smaller, faster, more present
  { id: 'b1', rx: 30, ry: 30, color: colors.navy, opacity: 0.10, orbitRx: 70, orbitRy: 65, period: 8000, phaseOffset: Math.PI * 0.5, layer: 'front' },
  { id: 'b2', rx: 25, ry: 22, color: colors.clay, opacity: 0.08, orbitRx: 80, orbitRy: 50, period: 10000, phaseOffset: Math.PI * 1.1, layer: 'front' },
];

export function AnimatedAuthHeader() {
  const backBlobs = BLOBS.filter((b) => b.layer === 'back');
  const frontBlobs = BLOBS.filter((b) => b.layer === 'front');

  return (
    <View style={styles.container}>
      {/* SVG blobs layer */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          {BLOBS.map((b) => (
            <RadialGradient key={`grad-${b.id}`} id={`grad-${b.id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={b.color} stopOpacity={b.opacity} />
              <Stop offset="100%" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>

        {/* Back layer */}
        {backBlobs.map((b) => (
          <Ellipse
            key={b.id}
            cx={CENTER_X + b.orbitRx * Math.cos(b.phaseOffset)}
            cy={CENTER_Y + b.orbitRy * Math.sin(b.phaseOffset)}
            rx={b.rx}
            ry={b.ry}
            fill={`url(#grad-${b.id})`}
          />
        ))}

        {/* Front layer */}
        {frontBlobs.map((b) => (
          <Ellipse
            key={b.id}
            cx={CENTER_X + b.orbitRx * Math.cos(b.phaseOffset)}
            cy={CENTER_Y + b.orbitRy * Math.sin(b.phaseOffset)}
            rx={b.rx}
            ry={b.ry}
            fill={`url(#grad-${b.id})`}
          />
        ))}
      </Svg>

      {/* Logo — centered, above blobs */}
      <View style={styles.logoWrapper}>
        <View style={styles.logoContainer}>
          <BablooLogo size={72} color={colors.navy} />
        </View>
      </View>

      {/* Gradient fade at bottom */}
      <LinearGradient
        colors={['transparent', colors.bg]}
        style={styles.fadeGradient}
        locations={[0, 1]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HEADER_H,
    width: '100%',
    overflow: 'hidden',
  },
  logoWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: HEADER_H * 0.15, // offset logo slightly above center to account for fade
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HEADER_H * 0.3, // bottom 30%
  },
});
```

**Step 2: Verify it renders by importing in auth screen temporarily**

Open `apps/mobile/app/(auth)/index.tsx`, add a temporary import at the top:
```tsx
import { AnimatedAuthHeader } from '../../src/components/AnimatedAuthHeader';
```
And temporarily add `<AnimatedAuthHeader />` before the `brandSection` to see it on screen. Verify logo renders centered with static colored ellipses behind it and a gradient fade at the bottom.

**Step 3: Revert the temporary import** (we'll do the proper integration in Task 4)

**Step 4: Commit**

```bash
git add apps/mobile/src/components/AnimatedAuthHeader.tsx
git commit -m "feat(mobile): add static AnimatedAuthHeader layout with blobs and logo"
```

---

### Task 3: Animate the blobs with Reanimated

**Files:**
- Modify: `apps/mobile/src/components/AnimatedAuthHeader.tsx`

**Step 1: Add Reanimated imports and animated blob positions**

Replace the static SVG rendering with animated positions. Key changes:

1. Import from Reanimated:
```tsx
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
```

2. Create animated SVG components:
```tsx
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
```

3. For each blob, create a sub-component `AnimatedBlob` that:
   - Takes a `BlobConfig` prop
   - Creates a `useSharedValue(0)` progress that goes from 0 to `2 * Math.PI` over `period` ms, repeated infinitely
   - Uses `useDerivedValue` to compute `cx` and `cy`:
     ```tsx
     const cx = useDerivedValue(() =>
       CENTER_X + config.orbitRx * Math.cos(progress.value + config.phaseOffset)
     );
     const cy = useDerivedValue(() =>
       CENTER_Y + config.orbitRy * Math.sin(progress.value + config.phaseOffset)
     );
     ```
   - Uses `useAnimatedProps` to return `{ cx: cx.value, cy: cy.value }`
   - Front-layer blob B1 should orbit in reverse: negate the progress value in the cos/sin calculation
   - Start the animation on mount with:
     ```tsx
     useEffect(() => {
       progress.value = withRepeat(
         withTiming(2 * Math.PI, { duration: config.period, easing: Easing.linear }),
         -1, // infinite
         false, // no reverse
       );
     }, []);
     ```

4. Render `<AnimatedEllipse animatedProps={animatedProps} ... />` instead of static `<Ellipse>`.

**Step 2: Verify animations are smooth**

Run the app on iOS simulator or device. Verify:
- All 5 blobs are moving smoothly in orbital paths
- Back layer blobs move slower than front layer
- B1 orbits in reverse direction
- No jank or frame drops
- Blobs stay within the header bounds (roughly)

**Step 3: Commit**

```bash
git add apps/mobile/src/components/AnimatedAuthHeader.tsx
git commit -m "feat(mobile): animate blobs with Reanimated orbital motion"
```

---

### Task 4: Integrate into auth screen + optional slogan

**Files:**
- Modify: `apps/mobile/app/(auth)/index.tsx`

**Step 1: Replace `brandSection` with `AnimatedAuthHeader`**

In `apps/mobile/app/(auth)/index.tsx`:

1. Add import:
```tsx
import { AnimatedAuthHeader } from '../../src/components/AnimatedAuthHeader';
```

2. Remove the entire `{/* ── Branding header ── */}` block (the `<View style={styles.brandSection}>` containing logo, brandName, slogan).

3. Add `<AnimatedAuthHeader />` as the first child inside the `<ScrollView>`, before the auth card.

4. Remove unused style declarations: `brandSection`, `logoContainer`, `brandName`, `slogan`. Also remove the `BablooLogo` import since it's now inside `AnimatedAuthHeader`.

**Step 2: Add optional slogan below the header**

After `<AnimatedAuthHeader />` and before the auth `<Card>`, add:

```tsx
<Animated.Text
  entering={FadeIn.delay(500).duration(800)}
  style={styles.slogan}
>
  {'Babloo gère.\nTu n\u2019as rien à faire.'}
</Animated.Text>
```

Import `FadeIn` from `react-native-reanimated` and `Animated` from `react-native-reanimated` (not from `react-native`).

Style for slogan:
```tsx
slogan: {
  fontFamily: fonts.dmSans.regular,
  fontSize: 15,
  lineHeight: 22,
  color: colors.textSec,
  textAlign: 'center',
  marginBottom: spacing.lg,
},
```

**Step 3: Verify the full screen**

- AnimatedAuthHeader renders at top with animated blobs + logo
- Gradient fades cleanly into `#EDEEF6`
- Slogan fades in after 500ms
- Auth card sits below slogan
- Scrolling works correctly
- No visual breaks between header and rest of screen

**Step 4: Evaluate the slogan**

Look at the screen. If the slogan doesn't look clean/premium, remove it and the associated style. The design doc says: "try, remove if not clean."

**Step 5: Commit**

```bash
git add apps/mobile/app/\(auth\)/index.tsx apps/mobile/src/components/AnimatedAuthHeader.tsx
git commit -m "feat(mobile): integrate animated header into auth screen"
```

---

### Task 5: Add scroll parallax effect

**Files:**
- Modify: `apps/mobile/app/(auth)/index.tsx`
- Modify: `apps/mobile/src/components/AnimatedAuthHeader.tsx`

**Step 1: Pass scroll offset to AnimatedAuthHeader**

In the auth screen:

1. Replace `<ScrollView>` with `<Animated.ScrollView>` from `react-native-reanimated`.
2. Create a shared value for scroll offset:
```tsx
const scrollY = useSharedValue(0);
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y;
  },
});
```
3. Pass `scrollY` as a prop to `<AnimatedAuthHeader scrollY={scrollY} />`.
4. Attach `onScroll={scrollHandler}` and `scrollEventThrottle={16}` to the `Animated.ScrollView`.

**Step 2: Apply parallax in AnimatedAuthHeader**

In `AnimatedAuthHeader.tsx`:

1. Accept `scrollY?: SharedValue<number>` prop.
2. Create an animated style for the blob SVG container:
```tsx
const parallaxStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: (scrollY?.value ?? 0) * 0.3 }],
}));
```
3. Wrap the SVG in an `<Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]}>`.

This makes the blobs move at 0.3x the scroll speed (70% parallax). The logo stays fixed since it's in a separate absolute-positioned wrapper.

**Step 3: Verify parallax**

- Scroll down: blobs shift up slower than content
- Logo moves with the content (or stays with blobs — decide which feels better)
- No glitches at scroll boundaries

**Step 4: Commit**

```bash
git add apps/mobile/app/\(auth\)/index.tsx apps/mobile/src/components/AnimatedAuthHeader.tsx
git commit -m "feat(mobile): add scroll parallax to auth header blobs"
```

---

### Task 6: Polish and performance verification

**Files:**
- Modify: `apps/mobile/src/components/AnimatedAuthHeader.tsx` (if needed)

**Step 1: Performance check**

Run on a real device (or simulator). Open the React Native performance monitor. Verify:
- JS thread stays at ~60fps
- UI thread stays at ~60fps
- No `useNativeDriver` warnings in console

If SVG `RadialGradient` causes performance issues, simplify blobs to use solid fill with low opacity instead:
```tsx
<Ellipse ... fill={b.color} opacity={b.opacity} />
```

**Step 2: Fine-tune blob parameters if needed**

After seeing the real render, you may want to adjust:
- Blob sizes (rx, ry)
- Orbit radii (orbitRx, orbitRy)
- Opacities
- Periods (speed)
- Phase offsets (starting positions)

These are all constants in the `BLOBS` array — easy to tweak.

**Step 3: Verify gradient fade quality**

The fade from the animated zone to `#EDEEF6` must be seamless. If there's a visible edge:
- Increase `fadeGradient` height from 30% to 40%
- Or add an intermediate color stop: `['transparent', 'rgba(237, 238, 246, 0.5)', '#EDEEF6']` with `locations={[0, 0.5, 1]}`

**Step 4: Final commit**

```bash
git add apps/mobile/src/components/AnimatedAuthHeader.tsx
git commit -m "polish(mobile): fine-tune auth header animation and performance"
```

---

### Summary of files touched

| File | Action |
|------|--------|
| `apps/mobile/package.json` | Modified (add expo-linear-gradient) |
| `pnpm-lock.yaml` | Modified (lockfile) |
| `apps/mobile/src/components/AnimatedAuthHeader.tsx` | **Created** |
| `apps/mobile/app/(auth)/index.tsx` | Modified (replace brandSection, add parallax) |
