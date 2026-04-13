/**
 * Webhook routes.
 *
 *   POST /webhook/alchemy  — HMAC verified, decodes on-chain events, dispatches push
 *   POST /webhook/stripe   — Stripe-Signature verified (Step 15)
 */

import type { FastifyInstance } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";
import { decodeEventLog, type Hex } from "viem";
import { ABIs } from "@partna/types";

import { env } from "../config.js";
import { supabaseAdmin } from "../db.js";

interface AlchemyLog {
  address: string;
  topics: string[];
  data: string;
  transactionHash: string;
}

interface AlchemyWebhookBody {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    data: {
      block: {
        logs: AlchemyLog[];
      };
    };
  };
}

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // ---------- POST /webhook/alchemy ----------
  app.post("/webhook/alchemy", async (request, reply) => {
    // 1. HMAC verify — reject instantly if signature fails
    const secret = env.ALCHEMY_WEBHOOK_SECRET;
    if (!secret) {
      request.log.error("ALCHEMY_WEBHOOK_SECRET not configured");
      return reply.code(500).send({ error: "Webhook secret not configured" });
    }

    const sigHeader = request.headers["x-alchemy-signature"] as string | undefined;
    if (!sigHeader) {
      return reply.code(401).send({ error: "Missing signature" });
    }

    const rawBody = JSON.stringify(request.body);
    const hmac = createHmac("sha256", secret).update(rawBody).digest("hex");
    const valid = timingSafeEqual(Buffer.from(hmac), Buffer.from(sigHeader));
    if (!valid) {
      request.log.warn("HMAC mismatch on Alchemy webhook");
      return reply.code(401).send({ error: "Invalid signature" });
    }

    // 2. Parse logs
    const body = request.body as AlchemyWebhookBody;
    const logs = body.event?.data?.block?.logs ?? [];

    for (const log of logs) {
      try {
        await processLog(log, app);
      } catch (err) {
        request.log.error({ err, txHash: log.transactionHash }, "failed to process log");
      }
    }

    return reply.code(200).send({ ok: true });
  });

  // ---------- POST /webhook/stripe (stub — Step 15) ----------
  app.post("/webhook/stripe", async (_request, reply) => {
    return reply.code(501).send({ error: "Stripe webhook wiring in Step 15" });
  });
}

async function processLog(log: AlchemyLog, app: FastifyInstance): Promise<void> {
  const txHash = log.transactionHash;
  const topics = log.topics as [Hex, ...Hex[]];
  const data = log.data as Hex;

  // Try to decode against SusuPool ABI
  let decoded;
  try {
    decoded = decodeEventLog({ abi: ABIs.SUSU_POOL_ABI, topics, data });
  } catch {
    return; // Not a SusuPool event — skip
  }

  const eventType = decoded.eventName;

  // 3. Idempotent write to webhook_events (UNIQUE tx_hash + event_type)
  const { error: insertErr } = await supabaseAdmin
    .from("webhook_events")
    .insert({
      source: "alchemy",
      tx_hash: txHash,
      event_type: eventType,
      raw_payload: log,
      processed_at: new Date().toISOString(),
    });

  if (insertErr) {
    if (insertErr.code === "23505") return; // duplicate — already processed
    throw insertErr;
  }

  // 4. Dispatch push notification based on event type
  const args = decoded.args as Record<string, unknown>;

  switch (eventType) {
    case "PayoutExecuted":
      await sendPush(
        (args.recipient as string).toLowerCase(),
        "PAYOUT",
        "Payout received!",
        `You received $${formatUsdc(args.amount as bigint)} USDC from your susu pool.`,
        { action: "PAYOUT", poolAddress: log.address, amount: String(args.amount) },
      );
      break;

    case "ContributionReceived":
      await sendPush(
        (args.member as string).toLowerCase(),
        "CONTRIBUTION_CONF",
        "Payment confirmed",
        `Your $${formatUsdc(args.amount as bigint)} USDC contribution was recorded.`,
        { action: "POOL_DETAIL", poolAddress: log.address },
      );
      break;

    case "MemberSlashed":
      // Notify all members of this pool (fetch from pool_metadata or just log.address)
      await sendPush(
        (args.member as string).toLowerCase(),
        "MEMBER_SLASHED",
        "Member slashed",
        "A member missed their contribution and was slashed.",
        { action: "POOL_DETAIL", poolAddress: log.address },
      );
      break;

    case "PoolCompleted":
      // In a full implementation, we'd fetch all members and notify each.
      // For now, log the event.
      app.log.info({ event: eventType, pool: log.address }, "Pool completed");
      break;
  }
}

function formatUsdc(wei: bigint): string {
  return (Number(wei) / 1e6).toFixed(2);
}

async function sendPush(
  walletAddress: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  // Write notification to DB
  await supabaseAdmin.from("notifications").insert({
    recipient_address: walletAddress,
    type,
    action: data.action ?? "HOME",
    title,
    body,
    data,
  });

  // Fetch device tokens
  const { data: tokens } = await supabaseAdmin
    .from("device_tokens")
    .select("expo_push_token")
    .eq("wallet_address", walletAddress)
    .eq("is_active", true);

  if (!tokens?.length) return;

  // Dispatch via Expo Push (simplified — batching in prod)
  const messages = tokens.map((t: { expo_push_token: string }) => ({
    to: t.expo_push_token,
    title,
    body,
    data,
    sound: type === "PAYOUT" ? "default" : undefined,
    priority: type === "PAYOUT" || type === "MEMBER_SLASHED" ? "high" : "default",
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(messages),
    });
  } catch {
    // Push delivery is best-effort; don't fail the webhook.
  }
}
