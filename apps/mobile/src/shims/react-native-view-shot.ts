import { findNodeHandle, Platform, TurboModuleRegistry } from 'react-native';

type CaptureOptions = {
  width?: number;
  height?: number;
  format?: 'jpg' | 'png' | 'webm' | 'raw';
  quality?: number;
  result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
  snapshotContentContainer?: boolean;
  handleGLSurfaceViewOnAndroid?: boolean;
  useRenderInContext?: boolean;
};

type ViewShotRef<T = unknown> =
  | number
  | T
  | { current: T | null };

type RNViewShotModule = {
  captureRef: (target: number, options: CaptureOptions) => Promise<string>;
  captureScreen: (options: CaptureOptions) => Promise<string>;
  releaseCapture: (uri: string) => void;
};

const RNViewShot = TurboModuleRegistry.get('RNViewShot') as RNViewShotModule | null;

const defaultOptions: Required<
  Pick<CaptureOptions, 'format' | 'quality' | 'result' | 'snapshotContentContainer' | 'handleGLSurfaceViewOnAndroid'>
> = {
  format: 'png',
  quality: 1,
  result: 'tmpfile',
  snapshotContentContainer: false,
  handleGLSurfaceViewOnAndroid: false,
};

function ensureModuleIsLoaded() {
  if (!RNViewShot) {
    throw new Error(
      'react-native-view-shot: Native module RNViewShot is undefined. Rebuild the dev app after installing the package.',
    );
  }
}

function normalizeOptions(options?: CaptureOptions): CaptureOptions {
  return {
    ...defaultOptions,
    ...options,
  };
}

function resolveTarget(viewRef: ViewShotRef): number {
  const target =
    viewRef && typeof viewRef === 'object' && 'current' in viewRef
      ? viewRef.current
      : viewRef;

  if (typeof target === 'number') {
    return target;
  }

  const node = findNodeHandle(target as Parameters<typeof findNodeHandle>[0]);
  if (!node) {
    throw new Error(`react-native-view-shot: unable to resolve native node for ${String(target)}`);
  }

  return node;
}

export async function captureRef(
  viewRef: ViewShotRef,
  options?: CaptureOptions,
): Promise<string> {
  ensureModuleIsLoaded();
  return RNViewShot!.captureRef(resolveTarget(viewRef), normalizeOptions(options));
}

export async function captureScreen(options?: CaptureOptions): Promise<string> {
  ensureModuleIsLoaded();
  return RNViewShot!.captureScreen(normalizeOptions(options));
}

export function releaseCapture(uri: string) {
  if (!uri) {
    return;
  }

  if (Platform.OS === 'web') {
    return;
  }

  RNViewShot?.releaseCapture(uri);
}

export default {
  captureRef,
  captureScreen,
  releaseCapture,
};
