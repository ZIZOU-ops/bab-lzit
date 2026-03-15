import React, { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing } from '../../constants/theme';

type MessageInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
};

export function MessageInput({
  value,
  onChangeText,
  onSend,
  onTypingStart,
  onTypingStop,
  disabled,
}: MessageInputProps) {
  const { t } = useTranslation();
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitTyping = (nextValue: string) => {
    if (nextValue.trim().length > 0) {
      onTypingStart();
    }

    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    typingDebounceRef.current = setTimeout(() => {
      onTypingStop();
    }, 500);
  };

  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={(nextValue) => {
            onChangeText(nextValue);
            emitTyping(nextValue);
          }}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            (disabled || value.trim().length === 0) && styles.sendButtonDisabled,
            pressed && !disabled && value.trim().length > 0 && styles.pressed,
          ]}
          onPress={() => {
            onTypingStop();
            onSend();
          }}
          disabled={disabled || value.trim().length === 0}
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
        >
          <Ionicons name="send" size={spacing.md + spacing.xs} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: spacing.xs / spacing.xs,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.full,
    borderWidth: spacing.xs / spacing.xs,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontFamily: 'DMSans_400Regular',
    fontSize: spacing.sm + spacing.xs + spacing.xs / 2,
    color: colors.navy,
    maxHeight: spacing['2xl'] * 3,
  },
  sendButton: {
    width: spacing['2xl'],
    height: spacing['2xl'],
    borderRadius: radius.full,
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
