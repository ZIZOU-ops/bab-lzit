# Auth Animated Header — Design Document

**Date**: 2026-03-16
**Status**: Approved

## Overview

Premium minimalist animated header for the auth screen. Floating blobs orbit around the BablooLogo, creating a living, organic backdrop that fades seamlessly into the app background `#EDEEF6`. No title text. Optional slogan with fade-in animation.

## Visual Structure

```
┌─────────────────────────────┐
│                             │
│       ◉                     │
│    ◉      ◉                 │  Zone animation (~40% écran)
│       [B]      ◉            │  Logo AU CENTRE, blobs orbitent
│    ◉      ◉                 │
│       ◉                     │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Fade gradient → #EDEEF6
│                             │
│  Babloo gère. Tu n'as       │  Slogan (optional, fade-in)
│  rien à faire.              │
│                             │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │     Auth Card         │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

## Blobs — 5 blobs, 2 depth layers

### Back layer (3 blobs — large, blurry, slow = atmosphere)

| Blob | Size   | Color                          | Opacity | Motion                  | Period |
|------|--------|--------------------------------|---------|-------------------------|--------|
| A1   | ~140px | Navy `#0E1442`                 | 0.07    | Wide orbit (r≈110px)    | 14s    |
| A2   | ~120px | Violet `#5C5C7A`               | 0.06    | Sinusoidal vertical     | 18s    |
| A3   | ~100px | Clay `#C4370D`                 | 0.05    | Diagonal drift          | 16s    |

### Front layer (2 blobs — smaller, sharper, faster = presence)

| Blob | Size  | Color                          | Opacity | Motion                          | Period |
|------|-------|--------------------------------|---------|---------------------------------|--------|
| B1   | ~60px | Navy `#0E1442`                 | 0.10    | Tight orbit (r≈70px), reverse   | 8s     |
| B2   | ~50px | Clay `#C4370D`                 | 0.08    | Elliptical orbit (80×50px)      | 10s    |

### Volume effect

Depth illusion created by:
- Back layer: larger, more blurred, lower opacity, slower
- Front layer: smaller, less blurred, higher opacity, faster
- Blobs B1 orbits in reverse direction of A1

### Orbital trajectories

```
x = centerX + radiusX * cos(progress * 2π + phaseOffset)
y = centerY + radiusY * sin(progress * 2π + phaseOffset)
```

Back layer blobs use combined sin/cos with different frequencies to avoid symmetry.
Front layer blobs orbit directly around the logo center.

## Color palette (strict — app DA only)

| Role       | Color           | Usage in blobs          |
|------------|-----------------|-------------------------|
| Navy       | `#0E1442`       | A1, B1 — dominant       |
| Violet     | `#5C5C7A`       | A2 — intermediate tone  |
| Clay       | `#C4370D`       | A3, B2 — warm accent    |
| Background | `#EDEEF6`       | Fade target             |

Clay/orange is present in 2 blobs (A3 + B2) at low opacity (5-8%). Warm punctuation, not dominance.

## Logo

- `BablooLogo` SVG (72px) in 96px white container with `shadows.md`
- Centered in the animation zone — the focal point
- Blobs render BEHIND the logo (lower zIndex)
- Logo "floats" in the living organic ecosystem

## Slogan (try, remove if not clean)

- Text: "Babloo gère. Tu n'as rien à faire."
- Font: DMSans Regular 13px, `colors.textSec`
- Animation: fadeIn opacity 0→1 over 800ms, delayed 500ms after mount
- Position: below the fade gradient, in solid `#EDEEF6` zone
- If the result isn't clean/premium enough, remove entirely

## Fade gradient

- `LinearGradient` overlay on bottom ~25% of animation zone
- `transparent` → `#EDEEF6`
- Seamless, imperceptible transition to app background

## Parallax (bonus)

- On scroll, blobs move at 0.5x speed vs content
- Implemented via `useAnimatedScrollHandler` from Reanimated

## Technical stack

- `react-native-reanimated` 4.2.1 — already installed
- `react-native-svg` 15.15.3 — already installed
- `expo-linear-gradient` — to install (lightweight Expo package)

## Component

Single file: `src/components/AnimatedAuthHeader.tsx`

Encapsulates all logic (blobs, animations, gradient, logo). Auth screen imports it and replaces current `brandSection`.

## Performance

- All animations on native UI thread (Reanimated worklets)
- SVG blur can be expensive → fallback: no blur, use larger size + lower opacity
- Max 5 blobs
- No external assets (0kb bundle impact beyond code)

## DA consistency

- SVG shapes only (no raster images)
- Opacities 5-10% — subtle, not distracting
- Strict palette: navy, violet, clay only
- Spacing system respected (`spacing.*`)
- Logo container keeps existing `radius.xl` + `shadows.md`
