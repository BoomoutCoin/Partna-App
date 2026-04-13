/**
 * PartNA Wallet logo — SVG recreation of the brand mark.
 * Blue flower symbol + wordmark.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showTagline?: boolean;
}

const sizeMap = { sm: 32, md: 48, lg: 72 };

function LogoInner({ size = "md", showText = true, showTagline = false }: LogoProps) {
  const s = sizeMap[size];

  return (
    <View style={styles.root}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#38BDF8" />
            <Stop offset="1" stopColor="#2563EB" />
          </LinearGradient>
          <LinearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#0EA5E9" />
            <Stop offset="1" stopColor="#3B82F6" />
          </LinearGradient>
        </Defs>
        {/* Top-right petal */}
        <Path d="M52 48 C52 30, 62 12, 80 8 C72 28, 68 38, 52 48Z" fill="url(#g1)" />
        {/* Top-left petal */}
        <Path d="M48 48 C48 30, 38 12, 20 8 C28 28, 32 38, 48 48Z" fill="url(#g2)" />
        {/* Bottom-right petal */}
        <Path d="M52 52 C52 70, 62 88, 80 92 C72 72, 68 62, 52 52Z" fill="url(#g2)" />
        {/* Bottom-left petal */}
        <Path d="M48 52 C48 70, 38 88, 20 92 C28 72, 32 62, 48 52Z" fill="url(#g1)" />
        {/* Right petal */}
        <Path d="M52 48 C70 48, 88 42, 94 24 C74 32, 62 38, 52 48Z" fill="url(#g1)" opacity="0.85" />
        {/* Left petal */}
        <Path d="M48 52 C30 52, 12 58, 6 76 C26 68, 38 62, 48 52Z" fill="url(#g1)" opacity="0.85" />
        {/* Center circle */}
        <Path d="M50 46 A4 4 0 1 1 50 54 A4 4 0 1 1 50 46Z" fill="#2563EB" />
      </Svg>

      {showText && (
        <View style={styles.textWrap}>
          <Text style={[styles.brandText, size === "lg" && styles.brandLg]}>
            Part<Text style={styles.brandAccent}>NA</Text>
          </Text>
          {size === "lg" && <Text style={styles.walletText}>Wallet</Text>}
          {showTagline && <Text style={styles.tagline}>DIGITAL SAVINGS WALLET</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: 12 },
  textWrap: {},
  brandText: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  brandLg: { fontSize: 32 },
  brandAccent: { color: "#38BDF8" },
  walletText: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5, marginTop: -6 },
  tagline: { fontSize: 10, fontWeight: "500", color: "rgba(255,255,255,0.4)", letterSpacing: 2.5, textTransform: "uppercase", marginTop: 4 },
});

export const Logo = memo(LogoInner);
