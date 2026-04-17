import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { captureRef, releaseCapture } from '../shims/react-native-view-shot';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle as SvgCircle,
  ClipPath,
  Defs,
  Image as SvgImage,
  Path,
  Pattern,
} from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const MAX_R = Math.ceil(Math.sqrt(W ** 2 + H ** 2)) + 24;
const INITIAL_R = 28;
const EXPAND_START_DELAY_FRAMES = 2;

const EXPAND_MS = 560;
const COLLAPSE_MS = 300;
const EXPAND_EASING = Easing.bezier(0.16, 0.62, 0.2, 1);
const COLLAPSE_EASING = Easing.bezier(0.4, 0, 0.22, 1);

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

type ExpandFn = (
  cx: number,
  cy: number,
  color: string,
  navigate: () => void,
  initialRadius?: number,
) => void;
type CollapseFn = (cx: number, cy: number, color: string, navigate?: () => void) => void;
type OverlayMode = 'expand' | 'collapse';

type OverlayState = {
  mode: OverlayMode;
  snapshotUri: string;
};

interface Ctx {
  triggerExpand: ExpandFn;
  triggerCollapse: CollapseFn;
}

const noopExpand: ExpandFn = (_, __, ___, navigate) => navigate();
const noopCollapse: CollapseFn = (_, __, ___, navigate) => navigate?.();
const fallback: Ctx = { triggerExpand: noopExpand, triggerCollapse: noopCollapse };

const RevealCtx = createContext<Ctx>(fallback);
export const useCircularReveal = () => useContext(RevealCtx);

function afterFrames(frameCount: number, work: () => void) {
  if (frameCount <= 0) {
    work();
    return;
  }

  requestAnimationFrame(() => afterFrames(frameCount - 1, work));
}

export function CircularRevealProvider({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<View>(null);
  const busy = useRef(false);
  const capturedUriRef = useRef<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayState | null>(null);

  const radius = useSharedValue(0);
  const centerX = useSharedValue(W / 2);
  const centerY = useSharedValue(H / 2);
  const opacity = useSharedValue(0);

  const releaseSnapshot = useCallback(() => {
    const previousUri = capturedUriRef.current;
    capturedUriRef.current = null;
    if (!previousUri) {
      return;
    }

    try {
      releaseCapture(previousUri);
    } catch {
      // Ignore tmp-file cleanup issues.
    }
  }, []);

  const cleanup = useCallback(() => {
    opacity.value = 0;
    radius.value = 0;
    setOverlay(null);
    releaseSnapshot();
    busy.current = false;
  }, [opacity, radius, releaseSnapshot]);

  const captureCurrentScreen = useCallback(async () => {
    const node = contentRef.current;
    if (!node) {
      return null;
    }

    try {
      const uri = await captureRef(node, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      return typeof uri === 'string' ? uri : null;
    } catch {
      return null;
    }
  }, []);

  const prepareOverlay = useCallback(
    (mode: OverlayMode, snapshotUri: string, x: number, y: number, startRadius: number) => {
      releaseSnapshot();
      capturedUriRef.current = snapshotUri;
      setOverlay({ mode, snapshotUri });
      centerX.value = x;
      centerY.value = y;
      radius.value = startRadius;
      opacity.value = 1;
    },
    [centerX, centerY, opacity, radius, releaseSnapshot],
  );

  const triggerExpand: ExpandFn = useCallback(
    (x, y, _color, navigate, initialRadius) => {
      if (busy.current) {
        return;
      }
      busy.current = true;

      void (async () => {
        const snapshotUri = await captureCurrentScreen();
        if (!snapshotUri) {
          busy.current = false;
          navigate();
          return;
        }

        const resolvedInitialRadius = Math.max(INITIAL_R, initialRadius ?? INITIAL_R);
        prepareOverlay('expand', snapshotUri, x, y, resolvedInitialRadius);

        afterFrames(1, () => {
          navigate();

          afterFrames(EXPAND_START_DELAY_FRAMES, () => {
            radius.value = withTiming(
              MAX_R,
              { duration: EXPAND_MS, easing: EXPAND_EASING },
              (didFinish) => {
                if (didFinish) {
                  runOnJS(cleanup)();
                }
              },
            );
          });
        });
      })();
    },
    [captureCurrentScreen, cleanup, prepareOverlay, radius],
  );

  const triggerCollapse: CollapseFn = useCallback(
    (x, y, _color, navigate) => {
      if (busy.current) {
        return;
      }
      busy.current = true;

      void (async () => {
        const snapshotUri = await captureCurrentScreen();
        if (!snapshotUri) {
          busy.current = false;
          navigate?.();
          return;
        }

        prepareOverlay('collapse', snapshotUri, x, y, MAX_R);

        afterFrames(1, () => {
          navigate?.();
          afterFrames(1, () => {
            radius.value = withTiming(
              0,
              { duration: COLLAPSE_MS, easing: COLLAPSE_EASING },
              (finished) => {
                if (finished) {
                  runOnJS(cleanup)();
                }
              },
            );
          });
        });
      })();
    },
    [captureCurrentScreen, cleanup, prepareOverlay, radius],
  );

  const expandPathProps = useAnimatedProps(() => {
    const r = Math.max(0.1, radius.value);
    const x = centerX.value;
    const y = centerY.value;

    return {
      d: `M0,0H${W}V${H}H0Z M${x},${y - r}a${r},${r} 0 1,0 0,${2 * r}a${r},${r} 0 1,0 0,${-2 * r}Z`,
    };
  });

  const collapseCircleProps = useAnimatedProps(() => ({
    cx: centerX.value,
    cy: centerY.value,
    r: Math.max(0.1, radius.value),
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <RevealCtx.Provider value={{ triggerExpand, triggerCollapse }}>
      <View ref={contentRef} collapsable={false} style={styles.content}>
        {children}
      </View>

      {overlay ? (
        <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
          <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
            <Defs>
              <Pattern id="revealSnapshotPattern" patternUnits="userSpaceOnUse" width={W} height={H}>
                <SvgImage
                  href={{ uri: overlay.snapshotUri }}
                  x="0"
                  y="0"
                  width={W}
                  height={H}
                  preserveAspectRatio="xMidYMid slice"
                />
              </Pattern>
              <ClipPath id="revealSnapshotClip">
                <AnimatedCircle animatedProps={collapseCircleProps} />
              </ClipPath>
            </Defs>

            {overlay.mode === 'expand' ? (
              <AnimatedPath
                animatedProps={expandPathProps}
                fill="url(#revealSnapshotPattern)"
                fillRule="evenodd"
              />
            ) : (
              <SvgImage
                href={{ uri: overlay.snapshotUri }}
                x="0"
                y="0"
                width={W}
                height={H}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#revealSnapshotClip)"
              />
            )}
          </Svg>
        </Animated.View>
      ) : null}
    </RevealCtx.Provider>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
