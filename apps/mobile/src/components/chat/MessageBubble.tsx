import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { useAuth } from '../../providers/AuthProvider';
import { parseChatMessageContent } from './messageContent';

type MessageBubbleProps = {
  content: string;
  createdAt: string | Date;
  isMine: boolean;
};

export function MessageBubble({ content, createdAt, isMine }: MessageBubbleProps) {
  const { i18n } = useTranslation();
  const { token } = useAuth();
  const parsedContent = parseChatMessageContent(content);

  return (
    <View style={[styles.wrap, isMine ? styles.mineWrap : styles.theirsWrap]}>
      {parsedContent.type === 'image' ? (
        <View style={[styles.imageBubble, isMine ? styles.mine : styles.theirs]}>
          <Image
            source={
              token
                ? {
                    uri: parsedContent.url,
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                : { uri: parsedContent.url }
            }
            style={styles.image}
          />
        </View>
      ) : (
        <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
          <Text style={[styles.body, isMine ? styles.bodyMine : styles.bodyTheirs]}>
            {parsedContent.text}
          </Text>
        </View>
      )}
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
  imageBubble: {
    borderRadius: radius.lg,
    padding: spacing.xs,
    overflow: 'hidden',
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
  image: {
    width: 208,
    height: 208,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
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
