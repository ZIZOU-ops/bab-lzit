import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCircularReveal } from '../../../src/providers/CircularRevealProvider';
import {
  DEFAULT_DEMAND_LEVEL,
  DEMAND_MULTIPLIERS,
  getDayDemandLevel,
  type DemandLevel,
  type TimeSlotKey,
} from '@babloo/shared/pricing';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { Button, ScreenHeader } from '../../../src/components/ui';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../../src/constants/theme';
import { trpc } from '../../../src/lib/trpc';

const serviceSchema = z.enum(['menage', 'cuisine', 'childcare']);

const DEMAND_COLORS: Record<DemandLevel, string> = {
  green: colors.success,
  yellow: colors.warning,
  red: colors.error,
};

// Available hours: 7h → 21h
const FROM_HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7..20
const TO_HOURS = Array.from({ length: 14 }, (_, i) => i + 8);   // 8..21

const MIN_DURATION = 2; // minimum 2h between from → to
const ALL_DAY_FROM = 7;
const ALL_DAY_TO = 21;

/** Returns the current hour (0-23) */
function getCurrentHour() {
  return new Date().getHours();
}

/** Returns today's date key */
function getTodayKey() {
  return formatDateKey(new Date());
}

/** Map a "from" hour to the backend TimeSlotKey */
function hourToSlotKey(hour: number): TimeSlotKey {
  if (hour < 8) return 'early_morning';
  if (hour < 10) return 'morning';
  if (hour < 16) return 'midday';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}h`;
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function getNextDays(days: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function getDayLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(date);
}

function getDayFullLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export default function BookingScheduleScreen() {
  const { triggerCollapse } = useCircularReveal();
  const { t, i18n } = useTranslation();
  const screenW = Dimensions.get('window').width;
  const params = useLocalSearchParams<{
    serviceType?: string;
    neighborhoodId?: string;
    cleanType?: string;
    originX?: string;
    originY?: string;
  }>();
  const parsedService = serviceSchema.safeParse(params.serviceType);
  const serviceType = parsedService.success ? parsedService.data : null;
  const neighborhoodId = typeof params.neighborhoodId === 'string' ? params.neighborhoodId : undefined;
  const cleanType =
    params.cleanType === 'simple' || params.cleanType === 'deep' ? params.cleanType : undefined;
  const originX = typeof params.originX === 'string' ? Number(params.originX) : null;
  const originY = typeof params.originY === 'string' ? Number(params.originY) : null;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [fromHour, setFromHour] = useState<number | null>(null);
  const [toHour, setToHour] = useState<number | null>(null);
  const [allDay, setAllDay] = useState(false);

  const fromScrollRef = useRef<ScrollView>(null);
  const toScrollRef = useRef<ScrollView>(null);

  // Approximate chip width (paddingH 14*2 + text ~28 + border 3) + gap 8
  const CHIP_SCROLL_UNIT = 67;

  const scrollToFirstAvailable = useCallback((dateKey: string) => {
    if (dateKey !== getTodayKey()) return;
    const now = getCurrentHour();
    // First available "from" hour: nowHour + 1
    const firstFromIdx = FROM_HOURS.findIndex((h) => h > now);
    if (firstFromIdx > 0) {
      // Scroll a bit before the first available so user sees the transition
      const offset = Math.max(0, (firstFromIdx - 0.5) * CHIP_SCROLL_UNIT);
      setTimeout(() => {
        fromScrollRef.current?.scrollTo({ x: offset, animated: true });
      }, 100);
    }
    // To row: scroll to same relative position
    const firstToIdx = TO_HOURS.findIndex((h) => h > now + MIN_DURATION);
    if (firstToIdx > 0) {
      const offset = Math.max(0, (firstToIdx - 0.5) * CHIP_SCROLL_UNIT);
      setTimeout(() => {
        toScrollRef.current?.scrollTo({ x: offset, animated: true });
      }, 100);
    }
  }, []);

  const calendarQuery = trpc.pricing.getDemandCalendar.useQuery({ days: 30 });

  const days = useMemo(() => getNextDays(30), []);

  const isToday = selectedDate === getTodayKey();
  const nowHour = getCurrentHour();

  // Derive backend slot key from "from" hour
  const selectedTimeSlot: TimeSlotKey | null = fromHour != null ? hourToSlotKey(fromHour) : null;
  const selectedDaySlots = selectedDate ? calendarQuery.data?.[selectedDate] : undefined;
  const selectedDemandLevel = (selectedTimeSlot
    ? selectedDaySlots?.[selectedTimeSlot]
    : undefined) ?? DEFAULT_DEMAND_LEVEL;

  const surchargeText = selectedDemandLevel === 'yellow'
    ? `+${Math.round((DEMAND_MULTIPLIERS.yellow - 1) * 100)}%`
    : selectedDemandLevel === 'red'
      ? `+${Math.round((DEMAND_MULTIPLIERS.red - 1) * 100)}%`
      : null;

  const canContinue = selectedDate && fromHour != null && toHour != null;

  // For the summary label
  const selectedDateObj = useMemo(
    () => (selectedDate ? days.find((d) => formatDateKey(d) === selectedDate) : undefined),
    [selectedDate, days],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('booking.scheduleTitle')}
        onBack={() => {
          triggerCollapse(originX ?? screenW / 2, originY ?? 340, colors.bg, () => {
            router.back();
          });
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Days ── */}
        <View style={styles.card}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {days.map((date) => {
              const dateKey = formatDateKey(date);
              const slotLevels = Object.values(calendarQuery.data?.[dateKey] ?? {}) as DemandLevel[];
              const dayLevel = getDayDemandLevel(slotLevels);
              const active = selectedDate === dateKey;

              return (
                <Pressable
                  key={dateKey}
                  style={({ pressed }) => [
                    styles.dayChip,
                    active && styles.dayChipActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setSelectedDate(dateKey);
                    setFromHour(null);
                    setToHour(null);
                    setAllDay(false);
                    scrollToFirstAvailable(dateKey);
                  }}
                >
                  <Text style={[styles.dayName, active && styles.dayNameActive]}>
                    {getDayLabel(date, i18n.language)}
                  </Text>
                  <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>
                    {date.getDate()}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      { backgroundColor: DEMAND_COLORS[dayLevel] },
                      active && styles.dayDotActive,
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── From → To ── */}
        <View style={styles.card}>
          {/* All day button */}
          <Pressable
            style={({ pressed }) => [
              styles.allDayChip,
              allDay && styles.allDayChipActive,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              if (allDay) {
                setAllDay(false);
                setFromHour(null);
                setToHour(null);
              } else {
                const from = isToday ? Math.max(nowHour + 1, ALL_DAY_FROM) : ALL_DAY_FROM;
                if (from >= ALL_DAY_TO - MIN_DURATION) return; // too late
                setAllDay(true);
                setFromHour(from);
                setToHour(ALL_DAY_TO);
              }
            }}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={allDay ? colors.white : colors.navy}
            />
            <Text style={[styles.allDayText, allDay && styles.allDayTextActive]}>
              {t('booking.allDay')}
            </Text>
          </Pressable>

          {/* From */}
          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>{t('booking.from')}</Text>
            <ScrollView
              ref={fromScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hoursRow}
            >
              {FROM_HOURS.map((h) => {
                const pastHour = isToday && h <= nowHour;
                const disabled = pastHour;
                const active = fromHour === h && !allDay;
                return (
                  <Pressable
                    key={h}
                    style={({ pressed }) => [
                      styles.hourChip,
                      active && styles.hourChipActive,
                      disabled && styles.hourChipDisabled,
                      pressed && !disabled && styles.pressed,
                    ]}
                    disabled={disabled}
                    onPress={() => {
                      setAllDay(false);
                      setFromHour(h);
                      // Auto-set "to" if not set or invalid (enforce min duration)
                      if (toHour == null || toHour < h + MIN_DURATION) {
                        setToHour(Math.min(h + MIN_DURATION, 21));
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.hourText,
                        active && styles.hourTextActive,
                        disabled && styles.hourTextDisabled,
                      ]}
                    >
                      {formatHour(h)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Arrow */}
          <View style={styles.arrowRow}>
            <View style={styles.arrowLine} />
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.arrowLine} />
          </View>

          {/* To */}
          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>{t('booking.to')}</Text>
            <ScrollView
              ref={toScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hoursRow}
            >
              {TO_HOURS.map((h) => {
                const tooClose = fromHour != null && h < fromHour + MIN_DURATION;
                const beforeFrom = fromHour != null && h <= fromHour;
                const disabled = beforeFrom || tooClose || fromHour == null;
                const active = toHour === h && !allDay;
                return (
                  <Pressable
                    key={h}
                    style={({ pressed }) => [
                      styles.hourChip,
                      active && styles.hourChipActive,
                      disabled && styles.hourChipDisabled,
                      pressed && !disabled && styles.pressed,
                    ]}
                    disabled={disabled}
                    onPress={() => {
                      setAllDay(false);
                      setToHour(h);
                    }}
                  >
                    <Text
                      style={[
                        styles.hourText,
                        active && styles.hourTextActive,
                        disabled && styles.hourTextDisabled,
                      ]}
                    >
                      {formatHour(h)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Demand info */}
          {fromHour != null && surchargeText && (
            <View style={styles.demandRow}>
              <View style={[styles.demandDot, { backgroundColor: DEMAND_COLORS[selectedDemandLevel] }]} />
              <Text style={styles.demandText}>{surchargeText}</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        {canContinue && selectedDateObj && (
          <View style={styles.summaryCard}>
            <Ionicons name="calendar-outline" size={18} color={colors.navy} />
            <Text style={styles.summaryText}>
              {getDayFullLabel(selectedDateObj, i18n.language)}
              {'  ·  '}
              {formatHour(fromHour!)} → {formatHour(toHour!)}
            </Text>
          </View>
        )}

        {/* Hint */}
        <Text style={styles.hint}>{t('booking.scheduleHint')}</Text>

        <Button
          variant="clay"
          label={t('booking.continue')}
          disabled={!canContinue}
          onPress={() => {
            if (!selectedDate || !selectedTimeSlot) return;

            const nextParams = {
              ...(neighborhoodId ? { neighborhoodId } : {}),
              selectedDate,
              selectedTimeSlot,
              demandLevel: selectedDemandLevel,
              ...(cleanType ? { cleanType } : {}),
            };

            if (serviceType) {
              router.push({
                pathname: '/(client)/booking/details',
                params: { serviceType, ...nextParams },
              });
            } else {
              router.push({
                pathname: '/(client)/booking/service',
                params: nextParams,
              });
            }
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* ── Header ── */
  header: {
    backgroundColor: colors.navy,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + spacing.xs,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.whiteA12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.8,
  },
  headerTitle: {
    fontFamily: fonts.nunito.bold,
    fontSize: 20,
    color: colors.white,
    flex: 1,
  },

  /* ── Content ── */
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },

  /* ── Shared card ── */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },

  /* ── Days ── */
  daysRow: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  dayChip: {
    width: 68,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  dayName: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  dayNameActive: {
    color: colors.whiteA70,
  },
  dayNumber: {
    ...textStyles.h2,
    color: colors.navy,
  },
  dayNumberActive: {
    color: colors.white,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  dayDotActive: {
    borderWidth: 1.5,
    borderColor: colors.white,
  },

  /* ── All day ── */
  allDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  allDayChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  allDayText: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 13,
    color: colors.navy,
  },
  allDayTextActive: {
    color: colors.white,
  },

  /* ── Time picker ── */
  timeSection: {
    gap: spacing.xs + 2,
  },
  timeLabel: {
    fontFamily: fonts.dmSans.semiBold,
    fontSize: 13,
    color: colors.textSec,
    marginLeft: spacing.xs,
  },
  hoursRow: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  hourChip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hourChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  hourChipDisabled: {
    opacity: 0.3,
  },
  hourText: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 14,
    color: colors.navy,
  },
  hourTextActive: {
    color: colors.white,
  },
  hourTextDisabled: {
    color: colors.textMuted,
  },

  /* ── Arrow ── */
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  /* ── Demand ── */
  demandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  demandDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  demandText: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 12,
    color: colors.clay,
  },

  /* ── Summary ── */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.clayTint,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  summaryText: {
    fontFamily: fonts.dmSans.semiBold,
    fontSize: 14,
    color: colors.navy,
    flex: 1,
  },

  /* ── Hint ── */
  hint: {
    fontFamily: fonts.dmSans.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },

  pressed: {
    opacity: 0.85,
  },
});
