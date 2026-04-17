import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type InputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  inputMode?: TextInputProps['inputMode'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: TextInputProps['keyboardType'];
  maxLength?: number;
  autoCorrect?: TextInputProps['autoCorrect'];
  returnKeyType?: TextInputProps['returnKeyType'];
  textContentType?: TextInputProps['textContentType'];
  textStyle?: StyleProp<TextStyle>;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry,
  multiline,
  numberOfLines,
  style,
  inputMode,
  autoCapitalize,
  keyboardType,
  maxLength,
  autoCorrect,
  returnKeyType,
  textContentType,
  textStyle,
  leftElement,
  rightElement,
}: InputProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          style={[
            styles.input,
            focused && styles.focused,
            leftElement ? styles.inputWithLeft : null,
            rightElement ? styles.inputWithRight : null,
            textStyle,
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label || placeholder || t('common.input')}
        />
        {leftElement ? <View style={styles.leftElement}>{leftElement}</View> : null}
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 12,
    color: colors.navy,
    marginBottom: 6,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.dmSans.regular,
    fontSize: 14,
    color: colors.navy,
    backgroundColor: colors.surface,
  },
  inputWithRight: {
    paddingRight: spacing['2xl'] + spacing.sm,
  },
  inputWithLeft: {
    paddingLeft: spacing['2xl'] + spacing.xs,
  },
  focused: {
    borderColor: colors.navy,
  },
  leftElement: {
    position: 'absolute',
    left: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  rightElement: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    marginTop: 6,
    fontFamily: fonts.dmSans.regular,
    fontSize: 12,
    color: colors.error,
  },
});
