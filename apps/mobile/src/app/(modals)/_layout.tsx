/**
 * Modals group layout — full-screen modals with NO tab bar.
 * Presentation mode: modal (slides up from bottom on iOS, fullscreen on Android).
 */

import { Stack } from "expo-router";
import { colors } from "../../theme";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
        contentStyle: { backgroundColor: colors.bg.surface },
      }}
    />
  );
}
