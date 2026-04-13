/**
 * Push notification helpers.
 *
 * Implementation lands in Step 12 (Alchemy webhook → Fastify → Expo Push).
 * For now these are stubs so imports elsewhere in the app compile.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/** Set up Android notification channels required by the payout / urgent flows. */
export async function createNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "PartNA",
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  await Notifications.setNotificationChannelAsync("urgent", {
    name: "Urgent — Payment due",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync("payout", {
    name: "Payouts",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
}

/**
 * Request permission + return an Expo Push token. The token is POSTed to
 * /notifications/device by the caller (wired in Step 12).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (existing !== "granted") {
    const { status: asked } = await Notifications.requestPermissionsAsync();
    status = asked;
  }
  if (status !== "granted") return null;

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  return tokenResponse.data;
}
