/**
 * Splash / auth-check entry. For now this is just a hand-off to the sign-in
 * screen. Onboarding carousel is added in Step 7+.
 */

import { Redirect } from "expo-router";

export default function AuthIndex() {
  return <Redirect href="/(auth)/sign-in" />;
}
