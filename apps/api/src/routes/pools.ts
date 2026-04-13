/**
 * Pool metadata routes.
 *
 *   POST /pools/metadata       — create after contract deploy
 *   GET  /pools/:address       — metadata + member display names
 *   PUT  /pools/:address       — update (organiser only)
 *   GET  /pools/discover       — public pools accepting members
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { isAddress } from "viem";
import { supabaseAdmin } from "../db.js";
import { normalizeAddress } from "../lib/address.js";

const createPoolMetaBody = z.object({
  contractAddress: z.string().refine(isAddress),
  displayName: z.string().min(1).max(80),
  isPrivate: z.boolean().default(false),
});

const updatePoolMetaBody = z.object({
  displayName: z.string().min(1).max(80).optional(),
  isPrivate: z.boolean().optional(),
});

export async function poolRoutes(app: FastifyInstance): Promise<void> {
  // ---------- POST /pools/metadata ----------
  app.post(
    "/pools/metadata",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = createPoolMetaBody.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid body", issues: parsed.error.issues });

      const contractAddress = normalizeAddress(parsed.data.contractAddress);

      const { error } = await supabaseAdmin.from("pool_metadata").insert({
        contract_address: contractAddress,
        display_name: parsed.data.displayName,
        organiser_address: request.user.walletAddress,
        is_private: parsed.data.isPrivate,
      });

      if (error) {
        if (error.code === "23505") return reply.code(409).send({ error: "Pool already registered" });
        request.log.error({ err: error }, "pool metadata insert failed");
        return reply.code(500).send({ error: "Database error" });
      }

      return reply.code(201).send({ ok: true, contractAddress });
    },
  );

  // ---------- GET /pools/discover ----------
  // Must be registered BEFORE /pools/:address to avoid route conflict
  app.get("/pools/discover", async (request, reply) => {
    const page = Number((request.query as Record<string, string>).page ?? "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from("pool_metadata")
      .select("*", { count: "exact" })
      .eq("is_private", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      request.log.error({ err: error }, "pool discover query failed");
      return reply.code(500).send({ error: "Database error" });
    }

    return reply.send({ pools: data, total: count, page });
  });

  // ---------- GET /pools/:address ----------
  app.get<{ Params: { address: string } }>("/pools/:address", async (request, reply) => {
    const raw = request.params.address;
    if (!isAddress(raw)) return reply.code(400).send({ error: "Invalid address" });
    const addr = normalizeAddress(raw);

    const { data, error } = await supabaseAdmin
      .from("pool_metadata")
      .select("*")
      .eq("contract_address", addr)
      .maybeSingle();

    if (error) {
      request.log.error({ err: error }, "pool metadata fetch failed");
      return reply.code(500).send({ error: "Database error" });
    }
    if (!data) return reply.code(404).send({ error: "Pool not found" });

    return reply.send({ pool: data });
  });

  // ---------- PUT /pools/:address ----------
  app.put<{ Params: { address: string } }>(
    "/pools/:address",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const raw = request.params.address;
      if (!isAddress(raw)) return reply.code(400).send({ error: "Invalid address" });
      const addr = normalizeAddress(raw);

      const parsed = updatePoolMetaBody.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid body", issues: parsed.error.issues });

      const updates: Record<string, unknown> = {};
      if (parsed.data.displayName !== undefined) updates.display_name = parsed.data.displayName;
      if (parsed.data.isPrivate !== undefined) updates.is_private = parsed.data.isPrivate;

      const { data, error } = await supabaseAdmin
        .from("pool_metadata")
        .update(updates)
        .eq("contract_address", addr)
        .eq("organiser_address", request.user.walletAddress)
        .select()
        .maybeSingle();

      if (error) {
        request.log.error({ err: error }, "pool metadata update failed");
        return reply.code(500).send({ error: "Database error" });
      }
      if (!data) return reply.code(403).send({ error: "Not the organiser or pool not found" });

      return reply.send({ pool: data });
    },
  );
}
