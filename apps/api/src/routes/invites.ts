/**
 * Invite link routes.
 *
 *   POST   /invites            — create invite link (auth required)
 *   GET    /invites/:code      — validate code, pool preview (NO AUTH — for universal links)
 *   POST   /invites/:code/redeem — mark used (auth required)
 *   DELETE /invites/:code      — revoke (auth required, organiser only)
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { isAddress } from "viem";
import { supabaseAdmin } from "../db.js";

const createBody = z.object({
  poolContractAddress: z.string().refine(isAddress),
  maxUses: z.number().int().positive().optional(),
  expiresInSeconds: z.number().int().positive().default(7 * 86400), // 7 days default
});

function generateCode(): string {
  return randomBytes(10).toString("base64url").slice(0, 16);
}

export async function inviteRoutes(app: FastifyInstance): Promise<void> {
  // ---------- POST /invites ----------
  app.post(
    "/invites",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = createBody.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid body", issues: parsed.error.issues });

      const code = generateCode();
      const expiresAt = new Date(Date.now() + parsed.data.expiresInSeconds * 1000).toISOString();

      const { error } = await supabaseAdmin.from("invite_links").insert({
        code,
        pool_contract_address: parsed.data.poolContractAddress.toLowerCase(),
        created_by: request.user.walletAddress,
        max_uses: parsed.data.maxUses ?? null,
        expires_at: expiresAt,
        is_active: true,
      });

      if (error) {
        request.log.error({ err: error }, "invite insert failed");
        return reply.code(500).send({ error: "Database error" });
      }

      return reply.code(201).send({
        code,
        url: `https://partna.app/i/${code}`,
        expiresAt: new Date(expiresAt).getTime() / 1000,
      });
    },
  );

  // ---------- GET /invites/:code (NO AUTH) ----------
  app.get<{ Params: { code: string } }>("/invites/:code", async (request, reply) => {
    const { code } = request.params;

    const { data: invite, error } = await supabaseAdmin
      .from("invite_links")
      .select("*, pool_metadata(display_name, organiser_address)")
      .eq("code", code)
      .single();

    if (error || !invite) {
      return reply.code(404).send({ error: "Invite not found" });
    }

    const now = Date.now();
    const isExpired = new Date(invite.expires_at).getTime() < now;
    const isExhausted = invite.max_uses !== null && invite.use_count >= invite.max_uses;

    if (!invite.is_active || isExpired || isExhausted) {
      return reply.code(410).send({
        error: "Invite expired",
        reason: isExpired ? "expired" : isExhausted ? "max_uses_reached" : "deactivated",
      });
    }

    const poolMeta = invite.pool_metadata as { display_name?: string; organiser_address?: string } | null;

    return reply.send({
      code,
      poolContractAddress: invite.pool_contract_address,
      poolDisplayName: poolMeta?.display_name ?? "Unnamed pool",
      organiserDisplayName: poolMeta?.organiser_address ?? "Unknown",
      expiresAt: new Date(invite.expires_at).getTime() / 1000,
      isExpired: false,
    });
  });

  // ---------- POST /invites/:code/redeem ----------
  app.post<{ Params: { code: string } }>(
    "/invites/:code/redeem",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { code } = request.params;

      // Increment use_count. A proper RPC function would do this atomically;
      // for now, a simple increment suffices.
      const { data: invite } = await supabaseAdmin
        .from("invite_links")
        .select("use_count")
        .eq("code", code)
        .single();

      await supabaseAdmin
        .from("invite_links")
        .update({ use_count: (invite?.use_count ?? 0) + 1 })
        .eq("code", code);

      return reply.send({ ok: true });
    },
  );

  // ---------- DELETE /invites/:code ----------
  app.delete<{ Params: { code: string } }>(
    "/invites/:code",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { error } = await supabaseAdmin
        .from("invite_links")
        .update({ is_active: false })
        .eq("code", request.params.code)
        .eq("created_by", request.user.walletAddress);

      if (error) return reply.code(500).send({ error: "Database error" });
      return reply.code(204).send();
    },
  );
}
