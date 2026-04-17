import React, { useCallback, useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { ClayBottomArt } from '../../../src/components/ClayBottomArt';
import { ScreenHeader } from '../../../src/components/ui';
import { colors, fonts, radius, shadows, spacing } from '../../../src/constants/theme';
import { useCircularReveal } from '../../../src/providers/CircularRevealProvider';

type CleaningType = 'simple' | 'deep';

function CleaningTypeBlob({
  variant,
  width,
  height,
  fill,
}: {
  variant: CleaningType;
  width: number;
  height: number;
  fill: string;
}) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={variant === 'simple' ? '0 20 154 172' : '176 18 160 176'}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <Path
        d={
          variant === 'simple'
            ? 'M0.248108 112.276C-3.12999 80.0665 28.0793 32.3388 88.2644 32.3388C123.285 32.3388 154 67.0886 154 104.433C154 146.455 120.914 178.261 88.281 182.946C55.0588 187.714 4.01746 148.217 0.248108 112.276Z'
            : 'M188.191 56.0373C208.871 31.1128 264.821 20.0858 306.878 63.1376C331.35 88.1885 327.956 134.443 301.243 160.539C271.183 189.903 225.311 188.462 199.157 168.393C172.53 147.96 165.116 83.849 188.191 56.0373Z'
        }
        fill={fill}
      />
    </Svg>
  );
}

function CleaningTypeIcon({
  variant,
  size,
}: {
  variant: CleaningType;
  size: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      {variant === 'simple' ? (
        <G transform="translate(1 0)">
          <Path
            d="M29 40C29 34.5 33.5 30 39 30H66C67.7 30 69 31.3 69 33V59C69 64.5 64.5 69 59 69H31C29.3 69 28 67.7 28 66V41.5C28 40.7 28.2 40.3 29 40Z"
            fill="#D8DEFF"
            stroke={colors.navy}
            strokeWidth="5.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M53 30V46C53 49.9 56.1 53 60 53H69"
            stroke={colors.navy}
            strokeWidth="5.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M37 58C42.3 55.6 47.2 55.6 52.5 58"
            stroke={colors.whiteA55}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Line
            x1="69"
            y1="31"
            x2="77"
            y2="28.5"
            stroke={colors.clay}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <Line
            x1="71"
            y1="40"
            x2="80"
            y2="40"
            stroke={colors.clay}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <Path
            d="M24 29L26.2 24L28.4 29L33 31.2L28.4 33.4L26.2 38L24 33.4L19 31.2L24 29Z"
            fill={colors.clay}
          />
        </G>
      ) : (
        <G transform="translate(-6 1)">
          <Path
            d="M29 40C29 33.9 33.9 29 40 29H58C64.1 29 69 33.9 69 40V62.5H29V40Z"
            fill="none"
            stroke={colors.navy}
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M40 29V25C40 21.7 42.7 19 46 19H58"
            stroke={colors.navy}
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Rect x="36" y="38" width="17" height="7" rx="3.5" fill={colors.navy} />
          <Circle cx="38" cy="67" r="6" fill={colors.navy} />
          <Circle cx="62" cy="67" r="6" fill={colors.navy} />
          <Path
            d="M69 45C77 44.4 81 49.2 79 55.3C77.7 59.3 74.1 61.2 69 60.2"
            stroke={colors.navy}
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M71 60.5L80.5 70"
            stroke={colors.navy}
            strokeWidth="6.2"
            strokeLinecap="round"
          />
          <Path
            d="M78 70H87"
            stroke={colors.navy}
            strokeWidth="6.2"
            strokeLinecap="round"
          />
          <Circle cx="58.5" cy="41.5" r="3.5" fill={colors.clay} />
          <Line
            x1="24"
            y1="45"
            x2="13"
            y2="45"
            stroke={colors.clay}
            strokeWidth="4.8"
            strokeLinecap="round"
          />
          <Line
            x1="25"
            y1="53"
            x2="11"
            y2="53"
            stroke={colors.clay}
            strokeWidth="4.8"
            strokeLinecap="round"
          />
        </G>
      )}
    </Svg>
  );
}

function CleaningTypeBubble({
  variant,
  label,
  slotWidth,
  blobWidth,
  blobHeight,
  pillWidth,
  onPress,
}: {
  variant: CleaningType;
  label: string;
  slotWidth: number;
  blobWidth: number;
  blobHeight: number;
  pillWidth: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.choice, { width: slotWidth }]}
      onPress={onPress}
    >
      <View style={[styles.choiceBlobWrap, { width: blobWidth, height: blobHeight }]}>
        <CleaningTypeBlob
          variant={variant}
          width={blobWidth}
          height={blobHeight}
          fill={colors.surface}
        />
        <View style={styles.choiceBlobInnerWrap}>
          <CleaningTypeBlob
            variant={variant}
            width={Math.round(blobWidth * (variant === 'deep' ? 0.84 : 0.76))}
            height={Math.round(blobHeight * (variant === 'deep' ? 0.84 : 0.76))}
            fill={variant === 'deep' ? colors.clayTint : colors.bgAlt}
          />
        </View>
        {variant === 'deep' ? (
          <>
            <View style={styles.choiceBlobOrbWrap}>
              <CleaningTypeBlob
                variant={variant}
                width={Math.round(blobWidth * 0.56)}
                height={Math.round(blobHeight * 0.56)}
                fill="#F4D7CE"
              />
            </View>
            <View style={styles.choiceBlobReflectionWrap} pointerEvents="none">
              <Svg
                width={Math.round(blobWidth * 0.9)}
                height={Math.round(blobHeight * 0.9)}
                viewBox="176 18 160 176"
                fill="none"
                preserveAspectRatio="xMidYMid meet"
              >
                <Ellipse
                  cx="204"
                  cy="56"
                  rx="11"
                  ry="21"
                  fill={colors.whiteA55}
                  transform="rotate(34 204 56)"
                />
              </Svg>
            </View>
          </>
        ) : null}
        <View style={[styles.choiceIconWrap, variant === 'deep' && styles.choiceIconDeepWrap]}>
          <CleaningTypeIcon
            variant={variant}
            size={Math.round(blobWidth * (variant === 'deep' ? 0.68 : 0.62))}
          />
        </View>
      </View>
      <View style={[styles.choicePill, { width: pillWidth }]}>
        <Text
          style={styles.choiceLabel}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function BookingCleanTypeScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    serviceType?: string;
    neighborhoodId?: string;
    originX?: string;
    originY?: string;
  }>();
  const { width } = useWindowDimensions();

  const serviceType = typeof params.serviceType === 'string' ? params.serviceType : 'menage';
  const neighborhoodId = typeof params.neighborhoodId === 'string' ? params.neighborhoodId : undefined;
  const originX = typeof params.originX === 'string' ? Number(params.originX) : null;
  const originY = typeof params.originY === 'string' ? Number(params.originY) : null;
  const { triggerExpand, triggerCollapse } = useCircularReveal();
  const simpleBlobRef = useRef<View>(null);
  const deepBlobRef = useRef<View>(null);

  const handleBack = useCallback(() => {
    triggerCollapse(
      originX ?? width / 2,
      originY ?? 340,
      colors.navyMid,
      () => router.back(),
    );
  }, [originX, originY, triggerCollapse, width]);
  const choiceSlotWidth = useMemo(() => Math.min(168, Math.max(148, (width - 56) / 2)), [width]);
  const blobWidth = useMemo(() => choiceSlotWidth - 4, [choiceSlotWidth]);
  const blobHeight = useMemo(() => Math.round(blobWidth * 1.08), [blobWidth]);
  const simplePillWidth = useMemo(() => Math.max(112, choiceSlotWidth - 28), [choiceSlotWidth]);
  const deepPillWidth = useMemo(() => Math.max(138, choiceSlotWidth - 2), [choiceSlotWidth]);
  const bottomArtHeight = useMemo(() => (width * 224) / 402, [width]);
  const bottomArtVisibleHeight = useMemo(() => Math.round(bottomArtHeight * 0.56), [bottomArtHeight]);

  const openSchedule = useCallback(
    (cleanType: CleaningType) => {
      const navigate = (nextOriginX?: number, nextOriginY?: number) => {
        router.push({
          pathname: '/(client)/booking/schedule',
          params: {
            serviceType,
            ...(neighborhoodId ? { neighborhoodId } : {}),
            cleanType,
            ...(nextOriginX != null && nextOriginY != null
              ? { originX: String(nextOriginX), originY: String(nextOriginY) }
              : {}),
          },
        });
      };

      const ref = cleanType === 'simple' ? simpleBlobRef : deepBlobRef;
      const node = ref.current;
      if (node) {
        node.measureInWindow((x, y, w, h) => {
          const nextOriginX = x + w / 2;
          const nextOriginY = y + h / 2;
          const initialRadius = Math.max(28, Math.min(w, h) * 0.28);
          triggerExpand(nextOriginX, nextOriginY, colors.navyMid, () =>
            navigate(nextOriginX, nextOriginY),
            initialRadius,
          );
        });
      } else {
        navigate();
      }
    },
    [triggerExpand, serviceType, neighborhoodId],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('home.cleaningModes.standard')}
        backgroundColor={colors.navyMid}
        onBack={handleBack}
      />

      <View style={styles.stage}>
        <View style={styles.choicesRow}>
          <View ref={simpleBlobRef} collapsable={false}>
            <CleaningTypeBubble
              variant="simple"
              label={t('booking.simple')}
              slotWidth={choiceSlotWidth}
              blobWidth={blobWidth}
              blobHeight={blobHeight}
              pillWidth={simplePillWidth}
              onPress={() => openSchedule('simple')}
            />
          </View>
          <View ref={deepBlobRef} collapsable={false}>
            <CleaningTypeBubble
              variant="deep"
              label={t('booking.deep')}
              slotWidth={choiceSlotWidth}
              blobWidth={blobWidth}
              blobHeight={blobHeight}
              pillWidth={deepPillWidth}
              onPress={() => openSchedule('deep')}
            />
          </View>
        </View>
      </View>

      <View style={[styles.bottomArtWrap, { height: bottomArtVisibleHeight }]} pointerEvents="none">
        <ClayBottomArt width={width} />
      </View>

      <View
        style={[
          styles.learnMoreWrap,
          {
            bottom: Math.max(Platform.OS === 'ios' ? 36 : 28, bottomArtVisibleHeight * 0.14),
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.learnMorePill}>
          <Text style={styles.learnMoreText}>{t('booking.learnMore')}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyMid,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['2xl'] * 2 + spacing.sm,
    paddingTop: spacing.sm,
  },
  choicesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  choice: {
    alignItems: 'center',
  },
  choiceBlobWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  choiceBlobInnerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBlobOrbWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.82,
  },
  choiceBlobReflectionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconDeepWrap: {
    bottom: 7,
    transform: [{ translateX: -1 }],
  },
  choicePill: {
    marginTop: -16,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  choiceLabel: {
    fontFamily: fonts.nunito.bold,
    fontSize: 16,
    lineHeight: 19,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  bottomArtWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  learnMoreWrap: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 3,
  },
  learnMorePill: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.whiteA12,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  learnMoreText: {
    fontFamily: fonts.alexandria.bold,
    fontSize: 14.5,
    lineHeight: 16.5,
    color: colors.white,
    letterSpacing: -0.15,
  },
});
