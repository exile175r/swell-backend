import React from "react";
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";

interface WaveLogoProps {
  size?: number;
  color?: string;
}

/**
 * @description '너울'의 정체성을 담은 프리미엄 파도 로고 (SVG)
 */
const WaveLogo: React.FC<WaveLogoProps> = ({ size = 100, color = "#00E0D0" }) => {
  const gradientId = React.useMemo(() => `waveGradient-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="100" y2="100">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor="#00AFA3" />
        </LinearGradient>
      </Defs>

      {/* Background Subtle Accent */}
      <Circle cx="50" cy="50" r="45" stroke={color} strokeWidth="0.5" strokeDasharray="4 4" opacity="0.1" />

      {/* Main Wave - Dynamic Curve */}
      <Path
        d="M15 55C15 55 25 40 40 55C55 70 75 40 85 55"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Second Wave - Subtle Flow */}
      <Path
        d="M20 75C20 75 35 60 50 75C65 90 80 75 80 75"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />

      {/* Top Wave Peak - Minimalist Accent */}
      <Path d="M35 35C35 35 45 20 60 35" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />

      {/* Bubbles / Energy Points */}
      <Circle cx="70" cy="25" r="2" fill={color} opacity="0.4" />
      <Circle cx="78" cy="35" r="1.5" fill={color} opacity="0.2" />
    </Svg>
  );
};

export default WaveLogo;
