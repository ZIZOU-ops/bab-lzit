import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Circle, Ellipse, G, Line, Path, Rect, Svg } from 'react-native-svg';
import { ClayBottomArt } from '../../../src/components/ClayBottomArt';
import { DoodleBackground } from '../../../src/components/DoodleBackground';
import { MascotDot, type MascotMood } from '../../../src/components/MascotDot';
import { NeighborhoodPicker } from '../../../src/components/ui';
import { TypeText } from '../../../src/components/TypeText';
import { colors, fonts, radius, spacing, textStyles } from '../../../src/constants/theme';
import { useOrders } from '../../../src/hooks/orders/useOrderQueries';
import { useCircularReveal } from '../../../src/providers/CircularRevealProvider';
import { getPageItems } from '../../../src/lib/pagination';
import { getGreetingName } from '../../../src/lib/names';
import { useAuth } from '../../../src/providers/AuthProvider';
import {
  getBookingNeighborhoodId,
  setBookingNeighborhoodId,
} from '../../../src/state/bookingDraft';

type ServiceKey = 'menage' | 'cuisine' | 'childcare';
type CleaningMode = 'standard' | 'express' | 'recurrent';
type PendingBookingIntent = { kind: 'cleaning_mode'; mode: CleaningMode };

const liveTrackingStatuses = new Set(['en_route', 'in_progress']);
const SCENE_BACKGROUND_COLOR = '#1C2462';

function ModeIllustration({
  tone,
  size = 96,
  featured = false,
}: {
  tone: CleaningMode;
  size?: number;
  featured?: boolean;
}) {
  const baseColor = featured ? colors.clayTint : '#EEF1FF';
  const orbColor = featured ? '#F4D7CE' : '#D8DEFF';
  const highlightEllipse =
    tone === 'express'
      ? { cx: 26.5, cy: 27.5, rx: 5.2, ry: 9.2 }
      : { cx: 28, cy: 28, rx: 6, ry: 10.5 };

  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Circle cx="48" cy="46" r="30" fill={baseColor} />
      <Circle cx="48" cy="46" r="21" fill={orbColor} opacity={0.82} />
      <Ellipse
        cx={highlightEllipse.cx}
        cy={highlightEllipse.cy}
        rx={highlightEllipse.rx}
        ry={highlightEllipse.ry}
        fill={colors.whiteA55}
        transform={`rotate(34 ${highlightEllipse.cx} ${highlightEllipse.cy})`}
      />

      {tone === 'express' ? (
        <G>
          <Rect x="42" y="22" width="12" height="7" rx="3.5" fill={colors.navy} />
          <Circle cx="48" cy="48" r="15" stroke={colors.navy} strokeWidth="5" />
          <Line
            x1="48"
            y1="48"
            x2="48"
            y2="39"
            stroke={colors.navy}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Line
            x1="48"
            y1="48"
            x2="56"
            y2="43"
            stroke={colors.navy}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Line
            x1="22.5"
            y1="44"
            x2="29"
            y2="44"
            stroke={colors.clay}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <Line
            x1="20.5"
            y1="51"
            x2="28.5"
            y2="51"
            stroke={colors.clay}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <Path d="M63 22L70 18L67 27L74 25L64 36L67 28L60 30L63 22Z" fill={colors.clay} />
        </G>
      ) : null}

      {tone === 'standard' ? (
        <G transform="translate(0 2.5)">
          <Path
            d="M40 25H51.5V30H48.5C46.3 30 44.5 31.8 44.5 34V35.5"
            stroke={colors.navy}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M40 39.5C42.4 37.2 45.3 36 49 36C55 36 59.5 40.7 59.5 46.6V62H36.5V50.2C36.5 45.6 38 42 40 39.5Z"
            fill="none"
            stroke={colors.navy}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M46.5 62V53.8C46.5 50.8 48.8 48.4 51.8 48.4H53"
            stroke={colors.navy}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            x1="59.5"
            y1="24.5"
            x2="66.5"
            y2="22.5"
            stroke={colors.clay}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <Line
            x1="59.5"
            y1="29.5"
            x2="68"
            y2="29.5"
            stroke={colors.clay}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </G>
      ) : null}

      {tone === 'recurrent' ? (
        <>
          <Circle cx="53" cy="48" r="17" fill="#C9D2FF" opacity={0.95} />
          <Rect
            x="28"
            y="29"
            width="40"
            height="34"
            rx="8"
            stroke={colors.navy}
            strokeWidth="5"
          />
          <Rect x="29.4" y="30.2" width="37.2" height="7.6" rx="0" fill={colors.navy} />
          <Rect x="35" y="22" width="7" height="10" rx="2" fill={colors.navy} />
          <Rect x="54" y="22" width="7" height="10" rx="2" fill={colors.navy} />
          <Circle cx="59" cy="55" r="7" fill={colors.clay} />
          <Path
            d="M56 55L58.5 57.5L62.5 52.8"
            stroke={colors.white}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}
    </Svg>
  );
}

function toTimestamp(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
  return 0;
}

function getContextualGreeting(
  t: TFunction,
  firstName: string | undefined,
  activeOrderStatus: string | null,
  lastCompletedAt: Date | null,
  totalOrderCount: number,
): { text: string; mood: MascotMood } {
  const name = firstName;
  const params = name ? { name } : undefined;

  if (activeOrderStatus === 'in_progress') {
    return { text: t('home.greetingInProgress', params), mood: 'starEyes' };
  }

  if (activeOrderStatus === 'en_route') {
    return { text: t('home.greetingEnRoute', params), mood: 'happy' };
  }

  if (totalOrderCount === 0) {
    return { text: t('home.greetingFirstTime', params), mood: 'happy' };
  }

  if (lastCompletedAt) {
    const daysSince = (Date.now() - lastCompletedAt.getTime()) / 86400000;

    if (daysSince < 1) {
      return { text: t('home.greetingPostClean', params), mood: 'starEyes' };
    }

    if (daysSince < 3) {
      return { text: t('home.greetingStillFresh', params), mood: 'happy' };
    }

    if (daysSince < 7) {
      return { text: t('home.greetingNudge', params), mood: 'wink' };
    }

    if (daysSince < 14) {
      return { text: t('home.greetingInactive', params), mood: 'nervous' };
    }

    return { text: t('home.greetingWinBack'), mood: 'dizzy' };
  }

  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return { text: t('home.greetingMorning', params), mood: 'wink' };
  }

  if (hour >= 18) {
    return { text: t('home.greetingEvening', params), mood: 'wink' };
  }

  return {
    text: name ? t('home.greetingWithName', { name }) : t('home.greeting'),
    mood: 'wink',
  };
}

export default function ClientHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const ordersQuery = useOrders(10);
  const isFocused = useIsFocused();
  const [selectedNeighborhoodId, setSelectedNeighborhoodIdState] = useState<string | null>(() =>
    getBookingNeighborhoodId(),
  );
  const [isNeighborhoodPickerOpen, setIsNeighborhoodPickerOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<PendingBookingIntent | null>(null);
  const { triggerExpand } = useCircularReveal();
  const heroBlobRef = useRef<View>(null);
  const expressRef = useRef<View>(null);
  const recurrentRef = useRef<View>(null);

  useEffect(() => {
    if (!isFocused) return;
    void ordersQuery.refetch();
    const interval = setInterval(() => void ordersQuery.refetch(), 15000);
    return () => clearInterval(interval);
  }, [isFocused, ordersQuery.refetch]);

  useEffect(() => {
    if (isFocused) {
      setSelectedNeighborhoodIdState(getBookingNeighborhoodId());
    }
  }, [isFocused]);

  const activeOrder = useMemo(() => {
    const pages = ordersQuery.data?.pages ?? [];
    let candidate:
      | { id: string; status: 'en_route' | 'in_progress'; createdAt?: unknown; updatedAt?: unknown }
      | null = null;

    for (const page of pages) {
      const items = getPageItems(page);
      for (const item of items) {
        if (
          !item ||
          typeof item !== 'object' ||
          !('id' in item) ||
          !('status' in item) ||
          typeof item.id !== 'string' ||
          !liveTrackingStatuses.has(String(item.status))
        ) {
          continue;
        }

        const status = String(item.status);
        const nextCandidate = {
          id: item.id,
          status: status as 'en_route' | 'in_progress',
          createdAt: 'createdAt' in item ? item.createdAt : undefined,
          updatedAt: 'updatedAt' in item ? item.updatedAt : undefined,
        };

        if (!candidate) {
          candidate = nextCandidate;
          continue;
        }

        const itemTs = Math.max(
          toTimestamp(nextCandidate.updatedAt),
          toTimestamp(nextCandidate.createdAt),
        );
        const candTs = Math.max(
          toTimestamp(candidate.updatedAt),
          toTimestamp(candidate.createdAt),
        );

        if (itemTs > candTs) {
          candidate = nextCandidate;
        }
      }
    }

    return candidate ? { id: candidate.id, status: candidate.status } : null;
  }, [ordersQuery.data?.pages]);

  const { lastCompletedAt, totalOrderCount } = useMemo(() => {
    const pages = ordersQuery.data?.pages ?? [];
    let completed: Date | null = null;
    let count = 0;

    for (const page of pages) {
      const items = getPageItems(page);
      for (const item of items) {
        if (!item || typeof item !== 'object' || !('id' in item)) {
          continue;
        }

        count++;

        const status = 'status' in item ? String(item.status) : '';
        if (status === 'completed' || status === 'done') {
          const completedAtValue = 'completedAt' in item ? item.completedAt : null;
          const updatedAtValue = 'updatedAt' in item ? item.updatedAt : null;
          const timestamp = toTimestamp(completedAtValue ?? updatedAtValue);

          if (timestamp > 0) {
            const completedDate = new Date(timestamp);
            if (!completed || completedDate > completed) {
              completed = completedDate;
            }
          }
        }
      }
    }

    return { lastCompletedAt: completed, totalOrderCount: count };
  }, [ordersQuery.data?.pages]);

  const openBookingFlow = useCallback(
    (serviceType: ServiceKey, neighborhoodId: string, bookingMode?: CleaningMode) => {
      const navigate = (originX?: number, originY?: number) => {
        if (serviceType === 'menage' && bookingMode === 'standard') {
          router.push({
            pathname: '/(client)/booking/clean-type',
            params: {
              serviceType,
              neighborhoodId,
              ...(originX != null && originY != null
                ? { originX: String(originX), originY: String(originY) }
                : {}),
            },
          });
          return;
        }

        router.push({
          pathname: '/(client)/booking/schedule',
          params: bookingMode
            ? {
                serviceType,
                neighborhoodId,
                bookingMode,
                ...(originX != null && originY != null
                  ? { originX: String(originX), originY: String(originY) }
                  : {}),
              }
            : {
                serviceType,
                neighborhoodId,
                ...(originX != null && originY != null
                  ? { originX: String(originX), originY: String(originY) }
                  : {}),
              },
        });
      };

      // Pick the blob ref that was tapped
      const blobRef =
        bookingMode === 'express'
          ? expressRef
          : bookingMode === 'recurrent'
            ? recurrentRef
            : heroBlobRef;

      // Overlay color = CURRENT screen bg (mask hides home while new screen loads)
      const overlayColor = SCENE_BACKGROUND_COLOR;

      const node = blobRef.current;
      if (node) {
        node.measureInWindow((x, y, w, h) => {
          const originX = x + w / 2;
          const originY = y + h / 2;
          const initialRadius = Math.max(28, Math.min(w, h) * 0.28);
          triggerExpand(originX, originY, overlayColor, () => navigate(originX, originY), initialRadius);
        });
      } else {
        navigate();
      }
    },
    [triggerExpand],
  );

  const handleCleaningModePress = (mode: CleaningMode) => {
    if (!selectedNeighborhoodId) {
      setPendingIntent({ kind: 'cleaning_mode', mode });
      setIsNeighborhoodPickerOpen(true);
      return;
    }

    openBookingFlow('menage', selectedNeighborhoodId, mode);
  };
  const firstName = getGreetingName(user?.fullName);
  const { text: greetingText, mood: currentMood } = useMemo(
    () =>
      getContextualGreeting(
        t,
        firstName,
        activeOrder?.status ?? null,
        lastCompletedAt,
        totalOrderCount,
      ),
    [activeOrder?.status, firstName, lastCompletedAt, t, totalOrderCount],
  );
  const sketchScale = screenWidth / 402;
  const offerScale = Math.min(1, Math.max(0.82, sketchScale * 0.92));
  const headerInsetY = Platform.OS === 'ios' ? 18 * sketchScale : 0;
  const sceneHeight = Math.round(sketchScale * 874);
  const headerShapePath =
    'M-197 49.5C-197 79.3757 -186.705 108.959 -166.704 136.56C-146.703 164.162 -117.386 189.241 -80.4285 210.367C-43.4708 231.492 0.40442 248.25 48.692 259.683C96.9796 271.116 148.734 277 201 277C253.266 277 305.02 271.116 353.308 259.683C401.596 248.25 445.471 231.492 482.429 210.367C519.386 189.241 548.703 164.162 568.704 136.56C588.705 108.959 599 79.3757 599 49.5L201 49.5H-197Z';
  const heroCutoutPath =
    'M117.271 303.349C113.585 268.153 147.632 216 213.288 216C251.493 216 285 253.972 285 294.779C285 340.697 248.906 375.452 213.307 380.57C177.064 385.781 121.383 342.622 117.271 303.349Z';
  const heroFrontPath =
    'M124.248 309.937C120.87 277.728 152.079 230 212.264 230C247.285 230 278 264.75 278 302.094C278 344.116 244.914 375.923 212.281 380.607C179.059 385.376 128.017 345.879 124.248 309.937Z';
  const secondaryLeftBlobPath =
    'M95.5468 495.103C72.332 483.504 53.4811 441.927 79.3205 401.392C94.3559 377.806 131.024 372.088 156.258 388.173C184.652 406.274 191.939 442.258 181.094 466.254C170.053 490.683 121.451 508.046 95.5468 495.103Z';
  const secondaryRightBlobPath =
    'M266.807 380.865C292.216 375.589 332.771 396.55 337.597 444.377C340.406 472.207 315.163 499.411 285.39 502.415C251.886 505.796 223.875 482.062 217.523 456.507C211.057 430.49 238.455 386.752 266.807 380.865Z';
  const heroBlobCenter = { x: 201.264, y: 305.304 };
  const secondaryLeftBlobCenter = { x: 122, y: 440 };
  const secondaryRightBlobCenter = { x: 277, y: 440 };
  const secondaryBlobYOffset = 8;
  const secondaryBlobScale = 0.9;
  const secondaryBlobShadowScale = 0.95;
  const pickerFrame = {
    top: 126 * sketchScale + headerInsetY,
    left: 74 * sketchScale,
    width: 254 * sketchScale,
    height: 50 * sketchScale,
  };
  const greetingTop = 70 * sketchScale + headerInsetY;
  const heroFrame = {
    top: 238 * sketchScale,
    left: 133 * sketchScale,
    width: 142 * sketchScale,
    height: 139 * sketchScale,
  };
  const secondaryLeftFrame = {
    top: 392 * sketchScale,
    left: 60 * sketchScale,
    width: 124 * sketchScale,
    height: 124 * sketchScale,
  };
  const secondaryRightFrame = {
    top: 392 * sketchScale,
    left: 215 * sketchScale,
    width: 124 * sketchScale,
    height: 124 * sketchScale,
  };
  const bottomClayFrame = {
    bottom: 0,
    left: 0,
    width: screenWidth,
    height: 224 * sketchScale,
  };
  const welcomeOfferCtaFrame = {
    right: 12 * sketchScale,
    bottom: 98 * sketchScale,
  };
  const navyDoodlesFrame = {
    top: 210 * sketchScale,
    left: 0,
    width: screenWidth,
    height: 310 * sketchScale,
  };
  const heroMode: CleaningMode = 'standard';
  const secondaryLeftMode: CleaningMode = 'express';
  const heroIllustrationSize = 192 * sketchScale;
  const secondaryIllustrationSize = 140 * sketchScale;
  const heroArtOffset = { x: -3 * sketchScale, y: 0 };
  const secondaryExpressArtOffset = { x: 3 * sketchScale, y: 0 };
  const recurrentArtOffset = { x: 1 * sketchScale, y: 2 * sketchScale };
  const heroTitleOffset = -10 * sketchScale;
  const secondaryTitleOffset = -9 * sketchScale;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.statusBarFill} pointerEvents="none" />
      <View style={styles.bodyLayer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="never"
          scrollEnabled={false}
          bounces={false}
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
        >
          {activeOrder ? (
            <Pressable
              style={({ pressed }) => [styles.trackBanner, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: '/(client)/order/tracking',
                  params: { orderId: activeOrder.id },
                })
              }
            >
              <View style={styles.trackPulse}>
                <Ionicons name="navigate" size={18} color={colors.clayLight} />
              </View>
              <View style={styles.trackCopy}>
                <Text style={styles.trackLabel}>{t('home.trackPro')}</Text>
                <Text style={styles.trackTitle}>{t('home.orderInProgress')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.whiteA65} />
            </Pressable>
          ) : null}

          <View style={[styles.scene, { height: sceneHeight }]}>
            <Svg
              width={screenWidth}
              height={sceneHeight}
              viewBox="0 0 402 874"
              style={styles.sceneSvg}
              pointerEvents="none"
            >
              <Rect width="402" height="874" fill={SCENE_BACKGROUND_COLOR} />
              <Rect width="402" height="56" fill={colors.surface} />
              <Path
                d={headerShapePath}
                fill={colors.transparent}
                stroke={colors.navyTint07}
                strokeWidth={12}
                opacity={0.32}
                transform="translate(0 3)"
              />
              <Path
                d={headerShapePath}
                fill={colors.surface}
                stroke={colors.border}
                strokeWidth={8}
              />
              <Path
                d={headerShapePath}
                fill={colors.transparent}
                stroke={colors.whiteA70}
                strokeWidth={1.5}
                opacity={0.22}
              />
              <Path d={heroCutoutPath} fill={SCENE_BACKGROUND_COLOR} />
              <Path d={heroFrontPath} fill={colors.surface} />
              <Path
                d={secondaryLeftBlobPath}
                fill={colors.bgAlt}
                transform={`translate(0 ${secondaryBlobYOffset}) translate(${secondaryLeftBlobCenter.x} ${secondaryLeftBlobCenter.y}) scale(${secondaryBlobShadowScale}) translate(${-secondaryLeftBlobCenter.x} ${-secondaryLeftBlobCenter.y})`}
              />
              <Path
                d={secondaryRightBlobPath}
                fill={colors.bgAlt}
                transform={`translate(0 ${secondaryBlobYOffset}) translate(${secondaryRightBlobCenter.x} ${secondaryRightBlobCenter.y}) scale(${secondaryBlobShadowScale}) translate(${-secondaryRightBlobCenter.x} ${-secondaryRightBlobCenter.y})`}
              />
              <Path
                d={secondaryLeftBlobPath}
                fill={colors.surface}
                transform={`translate(0 ${secondaryBlobYOffset}) translate(${secondaryLeftBlobCenter.x} ${secondaryLeftBlobCenter.y}) scale(${secondaryBlobScale}) translate(${-secondaryLeftBlobCenter.x} ${-secondaryLeftBlobCenter.y})`}
              />
              <Path
                d={secondaryRightBlobPath}
                fill={colors.surface}
                transform={`translate(0 ${secondaryBlobYOffset}) translate(${secondaryRightBlobCenter.x} ${secondaryRightBlobCenter.y}) scale(${secondaryBlobScale}) translate(${-secondaryRightBlobCenter.x} ${-secondaryRightBlobCenter.y})`}
              />
            </Svg>

            <View style={[styles.navyDoodlesWrap, navyDoodlesFrame]} pointerEvents="none">
              <View
                style={[
                  styles.navyDoodlesInner,
                  {
                    width: screenWidth,
                    height: sceneHeight,
                    top: -navyDoodlesFrame.top,
                  },
                ]}
              >
                <DoodleBackground
                  scope="cleaning"
                  color={colors.white}
                  opacityMultiplier={0.5}
                />
              </View>
            </View>

            <View style={[styles.header, { top: greetingTop }]}>
              <View style={styles.greetingRow}>
                <TypeText
                  text={greetingText}
                  style={styles.greeting}
                  speed={60}
                  delay={200}
                />
                <MascotDot mood={currentMood} size={28} style={styles.greetingMascot} />
              </View>
            </View>

            <View style={[styles.headerPickerWrap, pickerFrame]}>
              <NeighborhoodPicker
                compact
                value={selectedNeighborhoodId}
                label={t('home.serviceAddressLabel')}
                placeholder={t('booking.selectNeighborhood')}
                open={isNeighborhoodPickerOpen}
                onOpenChange={(open) => {
                  setIsNeighborhoodPickerOpen(open);
                  if (!open) setPendingIntent(null);
                }}
                onChange={(value) => {
                  setSelectedNeighborhoodIdState(value);
                  setBookingNeighborhoodId(value);

                  if (pendingIntent?.kind === 'cleaning_mode') {
                    setIsNeighborhoodPickerOpen(false);
                    openBookingFlow('menage', value, pendingIntent.mode);
                    setPendingIntent(null);
                  }
                }}
                style={[
                  styles.pickerOverride,
                  {
                    width: pickerFrame.width,
                    height: pickerFrame.height,
                    paddingVertical: 0,
                    paddingLeft: Math.max(12, 15 * sketchScale),
                    paddingRight: Math.max(16, 19 * sketchScale),
                    borderRadius: 25 * sketchScale,
                    backgroundColor: '#F4F4FA',
                  },
                ]}
              />
            </View>

            <Pressable
              ref={heroBlobRef}
              style={[styles.heroOrbPressable, heroFrame]}
              onPress={() => handleCleaningModePress(heroMode)}
            >
              <View
                style={[
                  styles.heroArtInner,
                  {
                    transform: [
                      { translateX: heroArtOffset.x },
                      { translateY: heroArtOffset.y },
                    ],
                  },
                ]}
              >
                <ModeIllustration tone={heroMode} size={heroIllustrationSize} featured />
              </View>
              <View style={[styles.modeTitlePill, styles.heroModeTitlePill, { bottom: heroTitleOffset }]}>
                <Text style={[styles.modeTitleText, styles.heroModeTitleText]}>
                  {t('home.cleaningModes.standard')}
                </Text>
              </View>
            </Pressable>

            <Pressable
              ref={expressRef}
              style={[styles.secondaryCard, secondaryLeftFrame]}
              onPress={() => handleCleaningModePress(secondaryLeftMode)}
            >
              <View
                style={[
                  styles.secondaryArtShell,
                  {
                    transform: [
                      { translateX: secondaryExpressArtOffset.x },
                      { translateY: secondaryExpressArtOffset.y },
                    ],
                  },
                ]}
              >
                <ModeIllustration tone={secondaryLeftMode} size={secondaryIllustrationSize} />
              </View>
              <View
                style={[styles.modeTitlePill, styles.secondaryModeTitlePill, { bottom: secondaryTitleOffset }]}
              >
                <Text style={[styles.modeTitleText, styles.secondaryModeTitleText]}>
                  {t('home.cleaningModes.express')}
                </Text>
              </View>
            </Pressable>

            <Pressable
              ref={recurrentRef}
              style={[styles.secondaryCard, secondaryRightFrame]}
              onPress={() => handleCleaningModePress('recurrent')}
            >
              <View
                style={[
                  styles.secondaryArtShell,
                  {
                    transform: [
                      { translateX: recurrentArtOffset.x },
                      { translateY: recurrentArtOffset.y },
                    ],
                  },
                ]}
              >
                <ModeIllustration tone="recurrent" size={secondaryIllustrationSize} />
              </View>
              <View
                style={[styles.modeTitlePill, styles.secondaryModeTitlePill, { bottom: secondaryTitleOffset }]}
              >
                <Text style={[styles.modeTitleText, styles.secondaryModeTitleText]}>
                  {t('home.cleaningModes.recurrent')}
                </Text>
              </View>
            </Pressable>

            <View style={[styles.bottomArtWrap, bottomClayFrame]} pointerEvents="none">
              <ClayBottomArt width={bottomClayFrame.width} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.welcomeOfferCtaWrap,
                welcomeOfferCtaFrame,
                pressed && styles.pressed,
              ]}
              onPress={() => handleCleaningModePress('standard')}
              accessibilityRole="button"
              accessibilityLabel={t('home.welcomeOfferCta')}
            >
              <View style={styles.welcomeOfferFooterRow}>
                <View
                  style={[
                    styles.welcomeOfferCtaLabelPill,
                    {
                      minHeight: 36 * offerScale,
                      borderRadius: 18 * offerScale,
                      paddingHorizontal: 14 * offerScale,
                      gap: 7 * offerScale,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.welcomeOfferCtaText,
                      {
                        fontSize: 14.5 * offerScale,
                        lineHeight: 16.5 * offerScale,
                      },
                    ]}
                  >
                    {t('home.welcomeOfferCta')}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16 * offerScale}
                    color={colors.white}
                  />
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  statusBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 60 : 28,
    backgroundColor: colors.surface,
    zIndex: 20,
  },
  scene: {
    position: 'relative',
    width: '100%',
    backgroundColor: SCENE_BACKGROUND_COLOR,
    overflow: 'hidden',
  },
  sceneSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  header: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 2,
  },
  headerPickerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  pickerOverride: {
    backgroundColor: '#F4F4FA',
    borderColor: '#D9DBE8',
    borderWidth: 1.5,
    shadowColor: colors.transparent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    alignSelf: 'center',
  },
  bodyLayer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  trackBanner: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.whiteA12,
    padding: spacing.md + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackPulse: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.whiteA07,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCopy: {
    flex: 1,
    gap: 2,
  },
  trackLabel: {
    ...textStyles.label,
    color: colors.clayLight,
  },
  trackTitle: {
    fontFamily: fonts.alexandria.semiBold,
    fontSize: 15,
    color: colors.white,
  },
  greeting: {
    fontFamily: fonts.alexandria.bold,
    fontSize: 27,
    lineHeight: 32,
    color: colors.navy,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingMascot: {
    marginLeft: spacing.sm + 2,
  },
  heroOrbPressable: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  heroArtInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitlePill: {
    position: 'absolute',
    alignSelf: 'center',
    minWidth: 92,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  heroModeTitlePill: {
    minWidth: 102,
    height: 34,
    paddingHorizontal: spacing.md - 1,
  },
  secondaryModeTitlePill: {
    minWidth: 88,
    height: 30,
    paddingHorizontal: spacing.sm + 2,
  },
  modeTitleText: {
    fontFamily: fonts.alexandria.bold,
    fontSize: 15,
    lineHeight: 17,
    color: colors.navy,
    textAlign: 'center',
    letterSpacing: -0.15,
  },
  heroModeTitleText: {
    fontSize: 15,
    lineHeight: 17,
  },
  secondaryModeTitleText: {
    fontSize: 15,
    lineHeight: 17,
  },
  expressBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.clay,
    width: 34,
    height: 34,
    paddingHorizontal: 0,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  expressBadgeText: {
    fontFamily: fonts.alexandria.bold,
    fontSize: 11,
    lineHeight: 13,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0,
    textAlign: 'center',
  },
  expressTitle: {
    fontFamily: fonts.alexandria.bold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.navy,
  },
  expressDesc: {
    fontFamily: fonts.dmSans.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.clay,
  },
  secondaryCard: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    zIndex: 2,
  },
  secondaryArtShell: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navyDoodlesWrap: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 1,
  },
  navyDoodlesInner: {
    position: 'absolute',
    left: 0,
  },
  bottomArtWrap: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  welcomeOfferCtaWrap: {
    position: 'absolute',
    zIndex: 4,
    alignItems: 'flex-end',
  },
  welcomeOfferFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  welcomeOfferCtaLabelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.whiteA12,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  welcomeOfferCtaText: {
    fontFamily: fonts.alexandria.bold,
    color: colors.white,
    letterSpacing: -0.15,
  },

  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.985 }],
  },
});
