/**
 * Avatar — initials fallback, hash-derived colour, optional ring.
 */

import { memo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { colors, typography } from "../../theme";

interface AvatarProps {
  name?: string | null | undefined;
  imageUrl?: string | null | undefined;
  address: string;
  size?: number;
  ring?: boolean;
}

const palette = [
  "#16A34A", "#2563EB", "#D97706", "#DC2626",
  "#5B21B6", "#0891B2", "#DB2777", "#4F46E5",
];

function hashColor(addr: string): string {
  let hash = 0;
  for (let i = 0; i < addr.length; i++) {
    hash = (hash * 31 + addr.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length]!;
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function AvatarInner({ name, imageUrl, address, size = 40, ring = false }: AvatarProps) {
  const bg = hashColor(address);
  const outerSize = ring ? size + 4 : size;

  return (
    <View
      style={[
        styles.outer,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          ...(ring && { borderWidth: 2, borderColor: colors.brand.green }),
        },
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={[
              typography.caption,
              { color: "#FFFFFF", fontSize: size * 0.38 },
            ]}
          >
            {initials(name)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});

export const Avatar = memo(AvatarInner);
