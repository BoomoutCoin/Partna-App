/**
 * Notification routes.
 *
 *   POST   /notifications/device    — register Expo push token
 *   DELETE /notifications/device    — unregister (on sign-out)
 *   GET    /notifications           — inbox, paginated
 *   PUT    /notifications/read-all
 *   PUT    /notifications/:id/read
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../db.js";

const deviceBody = z.object({
  expoPushToken: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  // ---------- POST /notifications/device ----------
  app.post(
    "/notifications/device",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = deviceBody.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid body" });

      const { error } = await supabaseAdmin.from("device_tokens").upsert(
        {
          wallet_address: request.user.walletAddress,
          expo_push_token: parsed.data.expoPushToken,
          platform: parsed.data.platform,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "expo_push_token" },
      );

      if (error) {
        request.log.error({ err: error }, "device token upsert failed");
        return reply.code(500).send({ error: "Database error" });
      }
      return reply.code(201).send({ ok: true });
    },
  );

  // ---------- DELETE /notifications/device ----------
  app.delete(
    "/notifications/device",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      await supabaseAdmin
        .from("device_tokens")
        .update({ is_active: false })
        .eq("wallet_address", request.user.walletAddress);
      return reply.code(204).send();
    },
  );

  // ---------- GET /notifications ----------
  app.get(
    "/notifications",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const page = Number((request.query as Record<string, string>).page ?? "1");
      const limit = 20;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("recipient_address", request.user.walletAddress)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        request.log.error({ err: error }, "notifications fetch failed");
        return reply.code(500).send({ error: "Database error" });
      }
      return reply.send({ notifications: data, total: count, page });
    },
  );

  // ---------- PUT /notifications/read-all ----------
  app.put(
    "/notifications/read-all",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      await supabaseAdmin
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_address", request.user.walletAddress)
        .eq("is_read", false);
      return reply.send({ ok: true });
    },
  );

  // ---------- PUT /notifications/:id/read ----------
  app.put<{ Params: { id: string } }>(
    "/notifications/:id/read",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", request.params.id)
        .eq("recipient_address", request.user.walletAddress);

      if (error) return reply.code(500).send({ error: "Database error" });
      return reply.send({ ok: true });
    },
  );
}
