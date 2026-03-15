import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';

export function TypingIndicator({ names }: { names: string[] }) {
  const { t } = useTranslation();

  if (names.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('chat.typingUsers', { names: names.join(', ') })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  text: {
    color: colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
