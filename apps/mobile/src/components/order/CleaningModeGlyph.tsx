import React from 'react';
import { Circle, G, Line, Path, Rect, Svg } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { CleaningOrderMode } from './orderListItem';

type CleaningModeGlyphProps = {
  mode: CleaningOrderMode;
  size?: number;
};

export function CleaningModeGlyph({
  mode,
  size = 28,
}: CleaningModeGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {mode === 'express' ? (
        <>
          <Rect x="19" y="5" width="10" height="6" rx="3" fill={colors.navy} />
          <Circle cx="24" cy="25" r="13" stroke={colors.navy} strokeWidth="4" />
          <Line
            x1="24"
            y1="25"
            x2="24"
            y2="17"
            stroke={colors.navy}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Line
            x1="24"
            y1="25"
            x2="31"
            y2="20.5"
            stroke={colors.navy}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Line
            x1="5.5"
            y1="21"
            x2="11.5"
            y2="21"
            stroke={colors.clay}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <Line
            x1="4"
            y1="28"
            x2="11"
            y2="28"
            stroke={colors.clay}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <Path
            d="M34 8L40 5L37.5 13L43 11L35 22L37 14L31.5 16L34 8Z"
            fill={colors.clay}
          />
        </>
      ) : null}

      {mode === 'standard' ? (
        <G transform="translate(0 1.5)">
          <Path
            d="M16 8.5H27V13.5H24C21.8 13.5 20 15.3 20 17.5V18.5"
            stroke={colors.navy}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16 22C18.2 19.9 20.8 18.9 24.2 18.9C29.5 18.9 33.5 23 33.5 28.3V40.5H13V30.6C13 26.6 14.3 23.8 16 22Z"
            stroke={colors.navy}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M21.5 40.5V33.9C21.5 31.4 23.5 29.4 26 29.4H27"
            stroke={colors.navy}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            x1="34.5"
            y1="10"
            x2="40.5"
            y2="8.5"
            stroke={colors.clay}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <Line
            x1="34.5"
            y1="15.5"
            x2="42"
            y2="15.5"
            stroke={colors.clay}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </G>
      ) : null}

      {mode === 'recurrent' ? (
        <>
          <Rect
            x="10"
            y="11"
            width="28"
            height="25"
            rx="6"
            stroke={colors.navy}
            strokeWidth="4"
          />
          <Rect x="11" y="12" width="26" height="6" fill={colors.navy} />
          <Rect x="16" y="6" width="5" height="8" rx="1.5" fill={colors.navy} />
          <Rect x="27" y="6" width="5" height="8" rx="1.5" fill={colors.navy} />
          <Circle cx="33.5" cy="31.5" r="6" fill={colors.clay} />
          <Path
            d="M31 31.5L33.1 33.6L36.5 29.9"
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
