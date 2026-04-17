export const fonts = {
  alexandria: {
    light: 'Alexandria_300Light',
    regular: 'Alexandria_400Regular',
    medium: 'Alexandria_500Medium',
    semiBold: 'Alexandria_800ExtraBold',
    bold: 'Alexandria_900Black',
    extraBold: 'Alexandria_800ExtraBold',
    black: 'Alexandria_900Black',
    italic: 'Alexandria_400Regular',
  },
  /** @deprecated Use fonts.alexandria instead */
  nunito: {
    light: 'Alexandria_300Light',
    regular: 'Alexandria_400Regular',
    medium: 'Alexandria_500Medium',
    semiBold: 'Alexandria_800ExtraBold',
    bold: 'Alexandria_900Black',
    extraBold: 'Alexandria_800ExtraBold',
    black: 'Alexandria_900Black',
    italic: 'Alexandria_400Regular',
  },
  /** @deprecated Use fonts.alexandria instead */
  fraunces: {
    light: 'Alexandria_300Light',
    regular: 'Alexandria_400Regular',
    medium: 'Alexandria_500Medium',
    semiBold: 'Alexandria_800ExtraBold',
    bold: 'Alexandria_900Black',
    extraBold: 'Alexandria_800ExtraBold',
    black: 'Alexandria_900Black',
    italic: 'Alexandria_400Regular',
  },
  dmSans: {
    light: 'DMSans_300Light',
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
  },
} as const;

export const textStyles = {
  display: { fontFamily: 'Alexandria_900Black', fontSize: 26, lineHeight: 31 },
  h1: { fontFamily: 'Alexandria_900Black', fontSize: 20, lineHeight: 26 },
  h2: { fontFamily: 'Alexandria_800ExtraBold', fontSize: 17, lineHeight: 23 },
  h3: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 21 },
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;
