import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing } from '../../constants/theme';

type MessageBubbleProps = {
  content: string;
  createdAt: string | Date;
  isMine: boolean;
};

export function MessageBubble({ content, createdAt, isMine }: MessageBubbleProps) {
  const { i18n } = useTranslation();

  return (
    <View style={[styles.wrap, isMine ? styles.mineWrap : styles.theirsWrap]}>
      <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
        <Text style={[styles.body, isMine ? styles.bodyMine : styles.bodyTheirs]}>{content}</Text>
      </View>
      <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
        {new Date(createdAt).toLocaleTimeString(i18n.language, {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: '82%',
    gap: spacing.xs,
  },
  mineWrap: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirsWrap: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.sm,
  },
  mine: {
    backgroundColor: colors.clay,
    borderTopRightRadius: spacing.sm,
    ...shadows.sm,
  },
  theirs: {
    backgroundColor: colors.surface,
    borderWidth: spacing.xs / spacing.xs,
    borderColor: colors.border,
    borderTopLeftRadius: spacing.sm,
  },
  body: {
    fontFamily: 'DMSans_500Medium',
    fontSize: spacing.sm + spacing.xs + spacing.xs / 2,
    lineHeight: spacing.lg + spacing.xs,
  },
  bodyMine: {
    color: colors.white,
  },
  bodyTheirs: {
    color: colors.textPrimary,
  },
  time: {
    fontFamily: 'DMSans_400Regular',
    fontSize: spacing.sm + spacing.xs - spacing.xs / 2,
  },
  timeMine: {
    color: colors.textMuted,
  },
  timeTheirs: {
    color: colors.textMuted,
  },
});
