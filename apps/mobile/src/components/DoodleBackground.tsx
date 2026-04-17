import React, { memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { G, Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/**
 * Home-service doodle SVG paths from Tabler Icons & Lucide (MIT license).
 * All paths use a 24×24 viewBox.
 */

type DoodleDef = { paths: string[]; circles?: { cx: number; cy: number; r: number }[] };

type DoodleScope = 'all' | 'cleaning';

const DOODLES: DoodleDef[] = [
  // ── MÉNAGE ──

  // Spray bottle (tabler)
  {
    paths: [
      'M4 12a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2l0 -7',
      'M6 10v-4a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v4',
      'M10 7h1',
    ],
    circles: [
      { cx: 15, cy: 7, r: 0.5 },
      { cx: 18, cy: 9, r: 0.5 },
      { cx: 18, cy: 5, r: 0.5 },
      { cx: 21, cy: 7, r: 0.5 },
    ],
  },

  // Iron (tabler)
  {
    paths: [
      'M9 6h7.459a3 3 0 0 1 2.959 2.507l.577 3.464l.81 4.865a1 1 0 0 1 -.985 1.164h-16.82a7 7 0 0 1 7 -7h9.8',
    ],
    circles: [{ cx: 12, cy: 15, r: 0.6 }],
  },

  // Bucket (tabler)
  {
    paths: [
      'M4 7a8 4 0 1 0 16 0a8 4 0 1 0 -16 0',
      'M4 7c0 .664 .088 1.324 .263 1.965l2.737 10.035c.5 1.5 2.239 2 5 2s4.5 -.5 5 -2c.333 -1 1.246 -4.345 2.737 -10.035a7.45 7.45 0 0 0 .263 -1.965',
    ],
  },

  // Washing / waves (tabler)
  {
    paths: [
      'M3.486 8.965c.168 .02 .34 .033 .514 .035c.79 .009 1.539 -.178 2 -.5c.461 -.32 1.21 -.507 2 -.5c.79 -.007 1.539 .18 2 .5c.461 .322 1.21 .509 2 .5c.79 .009 1.539 -.178 2 -.5c.461 -.32 1.21 -.507 2 -.5c.79 -.007 1.539 .18 2 .5c.461 .322 1.21 .509 2 .5c.17 0 .339 -.014 .503 -.034',
      'M3 6l1.721 10.329a2 2 0 0 0 1.973 1.671h10.612a2 2 0 0 0 1.973 -1.671l1.721 -10.329',
    ],
  },

  // Vacuum (tabler — simplified robot vacuum)
  {
    paths: [
      'M21 12a9 9 0 1 1 -18 0a9 9 0 0 1 18 0',
      'M14 9a2 2 0 1 1 -4 0a2 2 0 0 1 4 0',
    ],
    circles: [{ cx: 12, cy: 16, r: 0.5 }],
  },

  // ── CUISINE ──

  // Utensils / fork+knife (lucide)
  {
    paths: [
      'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2',
      'M7 2v20',
      'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
    ],
  },

  // Cooking pot (lucide)
  {
    paths: [
      'M2 12h20',
      'M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8',
      'm4 8 16-4',
      'm8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8',
    ],
  },

  // Kitchen tools (tabler — spatula + fork)
  {
    paths: [
      'M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12m0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3',
    ],
  },

  // Spray can (lucide — repurposed as oil/sauce bottle)
  {
    paths: [
      'm19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2',
      'm13 14 8-2',
      'm13 19 8-2',
    ],
  },

  // Lollipop (tabler — looks like a whisk/spoon)
  {
    paths: [
      'M7 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0',
      'M21 10a3.5 3.5 0 0 0 -7 0',
      'M14 10a3.5 3.5 0 0 1 -7 0',
      'M14 17a3.5 3.5 0 0 0 0 -7',
      'M14 3a3.5 3.5 0 0 0 0 7',
      'M3 21l6 -6',
    ],
  },

  // ── BABYSITTING ──

  // Baby bottle (tabler)
  {
    paths: [
      'M5 10h14',
      'M12 2v2',
      'M12 4a5 5 0 0 1 5 5v11a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-11a5 5 0 0 1 5 -5',
    ],
  },

  // Baby carriage (tabler)
  {
    paths: [
      'M6 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
      'M16 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
      'M2 5h2.5l1.632 4.897a6 6 0 0 0 5.693 4.103h2.675a5.5 5.5 0 0 0 0 -11h-.5v6',
      'M6 9h14',
      'M9 17l1 -3',
      'M16 14l1 3',
    ],
  },

  // ── COMMUN ──

  // Sparkles (tabler)
  {
    paths: [
      'M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6',
    ],
  },

  // Home (tabler — complete)
  {
    paths: [
      'M5 12h-2l9 -9l9 9h-2',
      'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7',
      'M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6',
    ],
  },
];

const CLEANING_DOODLES = DOODLES.slice(0, 5).concat(DOODLES.slice(-2));

// ── Pre-compute grid positions ──
const CELL_SIZE = 64;
const ICON_SIZE = 22;
const cols = Math.ceil(SCREEN_W / CELL_SIZE) + 1;
const rows = Math.ceil(SCREEN_H / CELL_SIZE) + 2;

interface DoodleItem {
  x: number;
  y: number;
  rotation: number;
  doodleIndex: number;
  opacity: number;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const SCALE = ICON_SIZE / 24;

type DoodleBackgroundProps = {
  scope?: DoodleScope;
  color?: string;
  opacityMultiplier?: number;
};

function getDoodleItems(source: DoodleDef[]) {
  const items: DoodleItem[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const seed = row * cols + col;
      const offsetX = (seededRand(seed * 2) - 0.5) * 18;
      const offsetY = (seededRand(seed * 3) - 0.5) * 18;
      items.push({
        x: col * CELL_SIZE + offsetX,
        y: row * CELL_SIZE + offsetY,
        rotation:
          Math.floor(seededRand(seed * 5) * 4) * 90 + seededRand(seed * 7) * 30 - 15,
        doodleIndex: Math.floor(seededRand(seed * 11) * source.length),
        opacity: 0.022 + seededRand(seed * 13) * 0.016,
      });
    }
  }

  return items;
}

const allDoodleItems = getDoodleItems(DOODLES);
const cleaningDoodleItems = getDoodleItems(CLEANING_DOODLES);

export const DoodleBackground = memo(function DoodleBackground({
  scope = 'all',
  color = colors.navy,
  opacityMultiplier = 1,
}: DoodleBackgroundProps) {
  const source = scope === 'cleaning' ? CLEANING_DOODLES : DOODLES;
  const items = scope === 'cleaning' ? cleaningDoodleItems : allDoodleItems;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={SCREEN_W} height={SCREEN_H} viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}>
        {items.map((item, i) => {
          const doodle = source[item.doodleIndex];
          return (
            <G
              key={i}
              transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}, ${ICON_SIZE / 2}, ${ICON_SIZE / 2})`}
              opacity={item.opacity * opacityMultiplier}
            >
              {doodle.paths.map((d, j) => (
                <Path
                  key={j}
                  d={d}
                  stroke={color}
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  transform={`scale(${SCALE})`}
                />
              ))}
              {doodle.circles?.map((c, j) => (
                <Circle
                  key={`c${j}`}
                  cx={c.cx * SCALE}
                  cy={c.cy * SCALE}
                  r={c.r * SCALE}
                  fill={color}
                  opacity={1}
                />
              ))}
            </G>
          );
        })}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
