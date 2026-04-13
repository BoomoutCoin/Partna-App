/**
 * User profile routes.
 *
 *   GET /users/me          — current user (from JWT), joined against users table
 *   PUT /users/me          — update display_name / avatar_url
 *   GET /users/:address    — public profile by wallet address
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { isAddress } from "viem";

import { supabaseAdmin } from "../db.js";
import { normalizeAddress } from "../lib/address.js";

const updateMeBody = z.object({
  displayName: z.string().min(1).max(80).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function userRoutes(app: FastifyInstance): Promise<void> {
  // ---------- GET /users/me ----------
  app.get(
    "/users/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const wallet = request.user.walletAddress;
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("wallet_address, display_name, avatar_url, on_time_rate, is_pro, created_at")
        .eq("wallet_address", wallet)
        .single();

      if (error) {
        request.log.error({ err: error }, "users/me select failed");
        return reply.code(500).send({ error: "Database error" });
      }
      return reply.send({ user: data });
    },
  );

  // ---------- PUT /users/me ----------
  app.put(
    "/users/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = updateMeBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid body", issues: parsed.error.issues });
      }

      const updates: Record<string, unknown> = {};
      if (parsed.data.displayName !== undefined) updates.display_name = parsed.data.displayName;
      if (parsed.data.avatarUrl !== undefined) updates.avatar_url = parsed.data.avatarUrl;

      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updates)
        .eq("wallet_address", request.user.walletAddress)
        .select("wallet_address, display_name, avatar_url, on_time_rate, is_pro, created_at")
        .single();

      if (error) {
        request.log.error({ err: error }, "users/me update failed");
        return reply.code(500).send({ error: "Database error" });
      }
      return reply.send({ user: data });
    },
  );

  // ---------- GET /users/:address ----------
  app.get<{ Params: { address: string } }>(
    "/users/:address",
    async (request, reply) => {
      const raw = request.params.address;
      if (!isAddress(raw)) {
        return reply.code(400).send({ error: "Invalid address" });
      }
      const wallet = normalizeAddress(raw);

      const { data, error } = await supabaseAdmin
        .from("users")
        .select("wallet_address, display_name, avatar_url, on_time_rate")
        .eq("wallet_address", wallet)
        .maybeSingle();

      if (error) {
        request.log.error({ err: error }, "public user lookup failed");
        return reply.code(500).send({ error: "Database error" });
      }
      if (!data) return reply.code(404).send({ error: "User not found" });
      return reply.send({ user: data });
    },
  );
}
