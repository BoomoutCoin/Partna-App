/**
 * Notifications — both stored in Supabase `notifications` table and
 * delivered via Expo Push SDK (in `data` field for deep-link routing).
 */

import type { Address } from "./pool.js";

export type NotificationType =
  | "PAYOUT"
  | "CONTRIBUTION_CONF"
  | "MEMBER_SLASHED"
  | "PAYMENT_REMINDER"
  | "POOL_FULL"
  | "POOL_COMPLETE";

/** Routing intent for deep links triggered from a notification tap. */
export type NotificationAction = "PAY" | "PAYOUT" | "POOL_DETAIL" | "HOME";

/** Shape of the `data` payload attached to every Expo push. */
export interface NotificationData {
  type: NotificationType;
  action: NotificationAction;
  poolAddress?: Address;
  cycle?: number;
  amount?: string; // bigint as decimal string; re-parse on device
  txHash?: `0x${string}`;
}

/** Row in Supabase `notifications` table. */
export interface StoredNotification {
  id: string;
  recipientAddress: Address;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  isRead: boolean;
  createdAt: number;
}
