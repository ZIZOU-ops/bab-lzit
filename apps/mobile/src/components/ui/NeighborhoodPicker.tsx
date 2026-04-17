import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NEIGHBORHOODS, type Neighborhood } from '@babloo/shared/pricing';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../constants/theme';
import { Input } from './Input';

const CITY_ORDER = ['rabat', 'sale', 'temara'] as const;
const CITY_FILTER_ORDER = ['all', ...CITY_ORDER] as const;

const CITY_LABEL_KEYS = {
  rabat: 'booking.cityRabat',
  sale: 'booking.citySale',
  temara: 'booking.cityTemara',
} as const;

const CITY_FILTER_LABEL_KEYS = {
  all: 'booking.cityAll',
  ...CITY_LABEL_KEYS,
} as const;

type CityFilterKey = (typeof CITY_FILTER_ORDER)[number];

type NeighborhoodPickerProps = {
  value?: string | null;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  compact?: boolean;
  actionLabel?: string;
  /** Use 'dark' when rendered on a dark background (e.g. branded header) */
  variant?: 'light' | 'dark';
};

const SHEET_HIDDEN_OFFSET = 440;
const SHEET_DISMISS_THRESHOLD = 120;

function normalizeForSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getNeighborhoodName(item: Neighborhood, language: string) {
  return language.startsWith('ar') ? item.nameAr : item.name;
}

export function NeighborhoodPicker({
  value,
  onChange,
  label,
  placeholder,
  style,
  open,
  onOpenChange,
  compact = false,
  actionLabel,
  variant = 'light',
}: NeighborhoodPickerProps) {
  const { t, i18n } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<CityFilterKey>('all');
  const isOpen = open ?? internalOpen;
  const [isMounted, setIsMounted] = useState(isOpen);
  const backdropProgress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const sheetTranslateY = useRef(new Animated.Value(isOpen ? 0 : SHEET_HIDDEN_OFFSET)).current;

  const setPickerOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const selectedNeighborhood = useMemo(
    () => NEIGHBORHOODS.find((item) => item.id === value) ?? null,
    [value],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSearch('');
    setCityFilter(selectedNeighborhood?.city ?? 'all');
  }, [isOpen, selectedNeighborhood]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropProgress, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 22,
            stiffness: 240,
            mass: 0.9,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return;
    }

    if (!isMounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(backdropProgress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_HIDDEN_OFFSET,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [backdropProgress, isMounted, isOpen, sheetTranslateY]);

  const animateSheetBackOpen = () => {
    Animated.parallel([
      Animated.timing(backdropProgress, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        damping: 24,
        stiffness: 260,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateSheetClosed = () => {
    Animated.parallel([
      Animated.timing(backdropProgress, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_HIDDEN_OFFSET,
        duration: 160,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setPickerOpen(false);
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation();
          backdropProgress.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          const nextY = Math.min(SHEET_HIDDEN_OFFSET, Math.max(0, gestureState.dy));
          const nextProgress = 1 - Math.min(nextY / SHEET_HIDDEN_OFFSET, 1);
          sheetTranslateY.setValue(nextY);
          backdropProgress.setValue(nextProgress);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose =
            gestureState.dy > SHEET_DISMISS_THRESHOLD || gestureState.vy > 1.1;

          if (shouldClose) {
            animateSheetClosed();
            return;
          }

          animateSheetBackOpen();
        },
        onPanResponderTerminate: () => {
          animateSheetBackOpen();
        },
      }),
    [backdropProgress, sheetTranslateY],
  );

  const displayValue = selectedNeighborhood
    ? getNeighborhoodName(selectedNeighborhood, i18n.language)
    : placeholder;
  const iconSize = compact ? spacing.xl - 2 : spacing.lg;
  const chevronSize = compact ? spacing.xl - 4 : spacing.lg;

  const sections = useMemo(() => {
    const query = normalizeForSearch(search);
    const language = i18n.language;

    const cities = cityFilter === 'all' ? CITY_ORDER : [cityFilter];

    return cities.map((city) => {
      const data = NEIGHBORHOODS
        .filter((item) => item.city === city)
        .filter((item) => {
          if (!query) {
            return true;
          }

          return [item.name, item.nameAr, getNeighborhoodName(item, language)].some((candidate) =>
            normalizeForSearch(candidate).includes(query),
          );
        })
        .sort((left, right) =>
          getNeighborhoodName(left, language).localeCompare(
            getNeighborhoodName(right, language),
            language.startsWith('ar') ? 'ar' : 'fr',
          ),
        );

      return {
        key: city,
        title: t(CITY_LABEL_KEYS[city]),
        data,
      };
    }).filter((section) => section.data.length > 0);
  }, [cityFilter, i18n.language, search, t]);

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          compact && styles.triggerCompact,
          pressed && styles.pressed,
          style,
        ]}
        onPress={() => setPickerOpen(true)}
      >
        <MaterialCommunityIcons
          name="map-marker"
          size={iconSize}
          color={variant === 'dark' ? colors.clayLight : colors.clay}
        />
        <View style={styles.textWrap}>
          {!compact ? (
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                variant === 'dark' && styles.labelDark,
              ]}
            >
              {label}
            </Text>
          ) : null}
          <Text
            style={[
              styles.value,
              compact && styles.valueCompact,
              !selectedNeighborhood && styles.placeholder,
              variant === 'dark' && styles.valueDark,
              variant === 'dark' && !selectedNeighborhood && styles.placeholderDark,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayValue}
          </Text>
        </View>
        <View style={styles.trailingWrap}>
          {actionLabel ? <Text style={styles.actionLabel}>{actionLabel}</Text> : null}
          <Ionicons
            name="chevron-down"
            size={chevronSize}
            color={variant === 'dark' ? colors.whiteA65 : colors.textMuted}
          />
        </View>
      </Pressable>

      <Modal transparent visible={isMounted} onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdropTapZone} onPress={() => setPickerOpen(false)}>
            <Animated.View style={[styles.backdrop, { opacity: backdropProgress }]} />
          </Pressable>

          <Animated.View
            style={[
              styles.sheetFrame,
              {
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
                  <View style={styles.sheetHandle} />
                </View>
                <Text style={styles.sheetTitle}>{t('booking.selectNeighborhood')}</Text>
              </View>
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder={t('booking.searchNeighborhood')}
                leftElement={<Ionicons name="search" size={spacing.md + spacing.xs} color={colors.textMuted} />}
                style={styles.searchInput}
              />
              <View style={styles.filtersRow}>
                {CITY_FILTER_ORDER.map((city) => {
                  const active = cityFilter === city;

                  return (
                    <Pressable
                      key={city}
                      style={({ pressed }) => [
                        styles.filterChip,
                        active && styles.filterChipActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => setCityFilter(city)}
                    >
                      <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
                        {t(CITY_FILTER_LABEL_KEYS[city])}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                renderItem={({ item }) => {
                  const active = item.id === value;

                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.row,
                        active && styles.rowActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        onChange(item.id);
                        setSearch('');
                        setPickerOpen(false);
                      }}
                    >
                      <MaterialCommunityIcons
                        name={active ? 'map-marker' : 'map-marker-radius-outline'}
                        size={spacing.md + spacing.xs}
                        color={colors.clay}
                      />
                      <Text style={styles.rowText}>{getNeighborhoodName(item, i18n.language)}</Text>
                    </Pressable>
                  );
                }}
              />
              <LinearGradient
                colors={['#FFFFFF00', '#FFFFFFFF']}
                style={styles.listFade}
                pointerEvents="none"
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md + spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  triggerCompact: {
    borderRadius: radius.full,
    paddingVertical: spacing.md - 1,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.xs + 2,
  },
  pressed: {
    opacity: 0.92,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  labelCompact: {
    fontSize: 9,
  },
  value: {
    fontFamily: fonts.alexandria.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.navy,
  },
  valueCompact: {
    fontFamily: fonts.alexandria.bold,
    fontSize: 18,
    lineHeight: 22,
  },
  placeholder: {
    color: colors.textMuted,
  },
  labelDark: {
    color: colors.whiteA65,
  },
  valueDark: {
    color: colors.white,
  },
  placeholderDark: {
    color: colors.whiteA55,
  },
  trailingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionLabel: {
    ...textStyles.label,
    color: colors.clay,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTapZone: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.navyOverlay45,
  },
  sheetFrame: {
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '84%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    overflow: 'hidden',
  },
  sheetHeader: {
    gap: spacing.xs,
  },
  sheetHandleArea: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    marginHorizontal: -spacing.md,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  sheetTitle: {
    ...textStyles.h2,
    color: colors.navy,
  },
  searchInput: {
    marginBottom: spacing.xs,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + spacing.xs,
  },
  filterChipActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navyTint07,
  },
  filterChipLabel: {
    ...textStyles.label,
    color: colors.textSec,
  },
  filterChipLabelActive: {
    color: colors.navy,
  },
  listContent: {
    paddingBottom: spacing.xl * 2,
    gap: spacing.xs,
  },
  listFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    marginHorizontal: -spacing.lg,
  },
  sectionHeader: {
    ...textStyles.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    marginBottom: spacing.xs,
  },
  rowActive: {
    backgroundColor: colors.clayTint,
    borderColor: colors.clayA24,
  },
  rowText: {
    ...textStyles.h3,
    color: colors.navy,
  },
});
