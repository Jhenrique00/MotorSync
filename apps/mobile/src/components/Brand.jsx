import React, { useId } from 'react';
import Svg, { Defs, ClipPath, Rect, Image, Mask, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { palettes } from '../theme/tokens';
// The original raster alpha preserves the exact glyphs. No substitute font or tracing.
// SYNC starts at x=462; x=457 is transparent between R and S in both originals.
export function Brand({ dark = false, small = false }) {
  const { mode } = useTheme();
  const isDark = dark || mode === 'dark';
  const colors = palettes[isDark ? 'dark' : 'light'];
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const width = isDark ? 661 : 662;
  const source = isDark
    ? require('../../assets/darkWordmark.png')
    : require('../../assets/lightWordmark.png');
  return (
    <Svg
      width={small ? 142 : 198}
      height={small ? 26 : 36}
      viewBox={`0 0 ${width} 108`}
      accessibilityLabel="MotorSync"
      accessible
      accessibilityRole="image"
    >
      <Defs>
        <ClipPath id={`original${id}`}>
          <Rect width="457" height="108" />
        </ClipPath>
        <Mask
          id={`letters${id}`}
          maskType="alpha"
          maskUnits="userSpaceOnUse"
          x="457"
          y="0"
          width="205"
          height="108"
        >
          <Image href={require('../../assets/darkWordmark.png')} width="661" height="108" />
        </Mask>
        <LinearGradient id={`chrome${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          {colors.chrome.map((color, i) => (
            <Stop key={i} offset={`${i * 25}%`} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Image href={source} width={width} height="108" clipPath={`url(#original${id})`} />
      <Rect
        x="457"
        width="205"
        height="108"
        fill={`url(#chrome${id})`}
        mask={`url(#letters${id})`}
      />
    </Svg>
  );
}
